// Sửa đơn sau khi tạo (docs/pages/orders.md#sửa-đơn) — giống applyEdit ở bo/src/lib/orders/edit.ts.
// Trước khi Bắt đầu làm sửa được cả sản phẩm và mã giảm giá; sau đó chỉ còn liên hệ, địa chỉ, giao hàng, ngày làm xong, ghi chú
import { BadRequestException, Injectable } from '@nestjs/common';
import { DEFAULT_DEPOSIT, depositAmount, formatMoney, viDate } from './money.js';
import type { EditOrderDto } from './orders.dto.js';
import { addEvent, itemDto, orderDto } from './orders.map.js';
import { OrdersService } from './orders.service.js';
import { assertAvailable } from './order-stock.js';

export const itemsEditable = (s: string) => s === 'pending' || s === 'paid';
const orderEditable = (s: string) => s !== 'completed' && s !== 'cancelled';
const clean = (s?: string) => s?.trim() || null;
const itemsText = (items: { name: string; quantity: number }[]) => items.map((i) => `${i.name} ×${i.quantity}`).join(', ');

@Injectable()
export class OrderEditService {
  constructor(private readonly orders: OrdersService) {}

  // Trả đơn sau khi sửa và danh sách thay đổi (ghi vào lịch sử). Không đổi gì thì changes rỗng, không ghi gì
  async edit(id: string, dto: EditOrderDto, by: string) {
    const settings = await this.orders.settings.get();
    return this.orders.prisma.$transaction(async (tx) => {
      const o = await this.orders.load(tx, id);
      if (!orderEditable(o.status)) throw new BadRequestException('Đơn đã hoàn tất hoặc đã hủy — không sửa được.');
      const canItems = itemsEditable(o.status) && !!dto.lines;
      if (dto.lines && !canItems) throw new BadRequestException('Đơn đã bắt đầu làm — không sửa sản phẩm được nữa.');
      const shipping = dto.shippingMethod && dto.shippingMethod !== o.shippingMethod ? settings.shippingOptions.find((x) => x.id === dto.shippingMethod) : undefined;
      if (dto.shippingMethod && dto.shippingMethod !== o.shippingMethod && !shipping) throw new BadRequestException('Không có phương thức giao này.');
      const carrier = !o.shipCarrierId && dto.carrierId && dto.carrierId !== o.carrierId ? settings.carriers.find((c) => c.id === dto.carrierId) : undefined;
      if (!o.shipCarrierId && dto.carrierId && dto.carrierId !== o.carrierId && !carrier) throw new BadRequestException('Không có đơn vị vận chuyển này.');
      const shippingFee = dto.shippingFee ?? o.shippingFee;

      let subtotal = o.subtotal;
      let discount = o.discount;
      let discountCode = o.discountCode;
      let discountId: string | null = null;
      let items = o.items.map((i) => itemDto(o.id, i));
      let newItems: Awaited<ReturnType<OrdersService['items']>> = [];
      if (canItems) {
        await assertAvailable(
          tx,
          dto.lines!.map((l) => ({ productId: l.productId, recipe: l.recipe, quantity: l.quantity })),
          o.id,
        );
        const d = await this.orders.discount(tx, { code: dto.discountCode, lines: dto.lines!, shippingFee, phone: dto.customer.phone, selfId: o.id, relaxedCode: o.discountCode });
        subtotal = dto.lines!.reduce((s, l) => s + l.price * l.quantity, 0);
        discount = d.amount;
        discountCode = d.code;
        discountId = d.id;
        newItems = await this.orders.items(tx, o.id, dto.lines!);
        items = newItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price, custom: i.custom ?? undefined, recipe: i.recipe })) as typeof items;
      }
      const total = Math.max(0, subtotal - discount + shippingFee);

      const next = {
        customerName: dto.customer.name.trim(),
        customerPhone: dto.customer.phone.trim(),
        customerEmail: dto.customer.email?.trim() ?? '',
        shippingAddress: dto.shippingAddress.trim(),
        readyDate: dto.readyDate,
        note: clean(dto.note),
        internalNote: clean(dto.internalNote),
      };
      const changes: string[] = [];
      const diff = (label: string, before: unknown, after: unknown, show = true) => {
        if (before !== after) changes.push(show && after ? `${label}: ${String(after as string)}` : label);
      };
      diff('Tên khách', o.customerName, next.customerName);
      diff('Số điện thoại', o.customerPhone, next.customerPhone);
      diff('Email', o.customerEmail, next.customerEmail);
      diff('Địa chỉ giao', o.shippingAddress, next.shippingAddress);
      if (shipping) changes.push(`Giao hàng: ${shipping.name} (${shipping.days} ngày)`);
      if (carrier) changes.push(`Đơn vị vận chuyển: ${carrier.name}`);
      if (shippingFee !== o.shippingFee) changes.push(`Phí giao: ${formatMoney(shippingFee)}`);
      if (o.readyDate !== next.readyDate) changes.push(`Ngày làm xong: ${viDate(next.readyDate)}`);
      const before = o.items.map((i) => itemDto(o.id, i));
      if (canItems && itemsText(before) !== itemsText(items)) changes.push(`Sản phẩm: ${itemsText(items)}`);
      else if (canItems && JSON.stringify(before.map((i) => [i.price, i.custom, i.recipe])) !== JSON.stringify(items.map((i) => [i.price, i.custom, i.recipe]))) changes.push('Cấu hình sản phẩm');
      if ((o.discountCode ?? '') !== (discountCode ?? '')) changes.push(discountCode ? `Mã giảm giá: ${discountCode}` : 'Bỏ mã giảm giá');
      diff('Ghi chú của khách', o.note, next.note, false);
      diff('Ghi chú nội bộ', o.internalNote, next.internalNote, false);
      if (total !== o.total) changes.push(`Tổng ${formatMoney(o.total)} → ${formatMoney(total)}`);
      if (!changes.length) return { order: orderDto(o), changes };

      await tx.order.update({
        where: { id },
        data: {
          ...next,
          ...(shipping && { shippingMethod: shipping.id, shippingName: `${shipping.name} (${shipping.days} ngày)`, shippingDays: shipping.days }),
          ...(carrier && { carrierId: carrier.id, carrierName: carrier.name }),
          subtotal,
          discount,
          discountCode,
          shippingFee,
          total,
          updatedAt: new Date(),
          ...(canItems && { items: { deleteMany: {}, createMany: { data: newItems } } }),
        },
      });
      // Chưa thanh toán: khoản đang chờ thu đổi theo tổng mới (cọc theo % lúc tạo đơn)
      if (o.status === 'pending' && o.paymentPlan !== 'later') {
        const amount = o.paymentPlan === 'deposit' ? depositAmount(Math.max(0, subtotal - discount), o.depositPercent ?? DEFAULT_DEPOSIT) : total;
        await tx.payment.updateMany({ where: { orderId: id, status: 'pending' }, data: { amount } });
      }
      // Đổi mã: trả lượt mã cũ, tính lượt mã mới
      if (o.discountCode !== discountCode) {
        await this.orders.releaseDiscount(tx, o.discountCode);
        if (discountId) await tx.discount.update({ where: { id: discountId }, data: { used: { increment: 1 } } });
      }
      await this.orders.ensureProfile(tx, o.id, dto.customer);
      await addEvent(tx, id, { status: o.status, kind: 'edit', note: `Sửa đơn · ${changes.join(' · ')}`, by });
      return { order: orderDto(await this.orders.load(tx, id)), changes };
    });
  }
}
