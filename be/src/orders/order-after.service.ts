// Hủy đơn, hoàn tiền, khiếu nại sau khi giao (docs/workflow.md mục 6–7). Giống cancel / recordRefund / refundPart / complain
// ở bo/src/hooks/use-orders.ts và CancelModal: hủy kéo theo hoàn Kho hoặc chuyển nến đã làm sang Sản phẩm hủy đơn, trả lượt mã giảm giá
import { BadRequestException, Injectable } from '@nestjs/common';
import { formatMoney, overpaid, paidAmount, refundFor } from './money.js';
import type { CancelDto, ComplaintDto, RefundDto } from './orders.dto.js';
import { addEvent, itemDto, orderDto, rowId, stamp } from './orders.map.js';
import { OrdersService } from './orders.service.js';
import { assertAvailable, hasConsumed, restoreOrder } from './order-stock.js';

const CAN_CANCEL = ['pending', 'paid', 'producing', 'ready', 'returned'];
const OUTCOME = { returned: 'Chưa làm: hoàn nguyên liệu đã trừ về Kho', stocked: 'Đã làm: chuyển sang Sản phẩm hủy đơn', consumed: 'Đã làm: không hoàn nguyên liệu' };
const FAULT = { customer: 'Lỗi do khách', shop: 'Lỗi do shop' };

@Injectable()
export class OrderAfterService {
  constructor(private readonly orders: OrdersService) {}

  // outcome: hỏi khi đơn Đang làm có nến tự phối hoặc đã trừ Kho. Nến tự phối đã làm xong (Chờ giao, hoàn về còn tốt) tự chuyển sang
  // Sản phẩm hủy đơn. fault: bắt buộc khi khách đã trả tiền — lỗi do shop hoàn hết, lỗi do khách giữ cọc
  cancel(id: string, dto: CancelDto, by: string) {
    return this.orders.prisma.$transaction(async (tx) => {
      const o = await this.orders.load(tx, id);
      if (!CAN_CANCEL.includes(o.status)) throw new BadRequestException('Chỉ hủy được trước khi giao, hoặc sau khi hàng đã hoàn về shop.');
      const crafted = o.items.some((i) => i.custom);
      const finished = crafted && (o.status === 'ready' || (o.status === 'returned' && o.returnCondition === 'good'));
      const ask = o.status === 'producing' && (crafted || (await hasConsumed(tx, o.code)));
      const outcome = finished ? 'stocked' : ask ? dto.outcome : undefined;
      if (ask && !outcome) throw new BadRequestException('Chọn đã làm hay chưa để xử lý Kho.');
      if (ask && outcome !== 'returned' && outcome !== (crafted ? 'stocked' : 'consumed'))
        throw new BadRequestException(crafted ? 'Đơn có nến tự phối: chọn hoàn nguyên liệu hoặc chuyển sang Sản phẩm hủy đơn.' : 'Đơn toàn nến có sẵn: chọn hoàn nguyên liệu hoặc không hoàn.');
      const paid = paidAmount(o);
      if (paid > 0 && !dto.fault) throw new BadRequestException('Chọn lỗi do ai để tính tiền hoàn.');
      const fault = paid > 0 ? dto.fault : undefined;
      const reason = dto.reason.trim();

      const restored = outcome === 'returned' ? await restoreOrder(tx, o.code, by) : 0;
      let stocked = 0;
      if (outcome === 'stocked') {
        const at = new Date();
        for (const row of o.items.filter((i) => i.custom)) {
          const item = itemDto(o.id, row);
          const cid = `${o.id}-${item.id}`;
          if (await tx.cancelledProduct.findUnique({ where: { id: cid } })) continue;
          // Có chữ riêng của khách (khắc tên, lời nhắn) thì khó bán lại
          const craft = (row.craft ?? {}) as Record<string, { kind?: string; values?: Record<string, string> }>;
          const personalized = Object.values(craft).some((s) => s?.kind === 'inputs' && Object.values(s.values ?? {}).some((v) => String(v).trim()));
          await tx.cancelledProduct.create({
            data: {
              id: cid,
              name: item.name,
              custom: item.custom ?? null,
              recipe: item.recipe ?? undefined,
              personalized,
              images: item.image ? [item.image] : [],
              price: item.price,
              quantity: item.quantity,
              orderId: o.id,
              orderCode: o.code,
              customerName: o.customerName,
              cancelReason: reason,
              cancelledAt: at,
              updatedAt: at,
            },
          });
          stocked++;
        }
      }
      await this.orders.releaseDiscount(tx, o.discountCode);
      const refundDue = fault ? refundFor(o, fault) : 0;
      await tx.order.update({
        where: { id },
        data: { status: 'cancelled', cancelReason: reason, cancelOutcome: outcome ?? null, cancelFault: fault ?? null, refundDue: refundDue || null, updatedAt: new Date() },
      });
      const note = [reason, outcome && OUTCOME[outcome], fault && FAULT[fault]].filter(Boolean).join(' · ');
      await addEvent(tx, id, { status: 'cancelled', note, by });
      return { order: orderDto(await this.orders.load(tx, id)), restored, stocked };
    });
  }

  // Ghi khoản đã hoàn cho khách sau khi hủy (kèm ảnh chứng từ)
  recordRefund(id: string, dto: RefundDto, by: string) {
    return this.orders.prisma.$transaction(async (tx) => {
      const o = await this.orders.load(tx, id);
      if (o.status !== 'cancelled' || !o.refundDue) throw new BadRequestException('Đơn không có khoản cần hoàn.');
      if (o.refundAmount !== null) throw new BadRequestException('Đơn đã ghi hoàn tiền.');
      if (dto.amount > paidAmount(o)) throw new BadRequestException(`Không hoàn quá số đã thu (${formatMoney(paidAmount(o))}).`);
      await tx.order.update({
        where: { id },
        data: { refundAmount: dto.amount, refundImages: dto.images ?? [], refundNote: dto.note?.trim() || null, refundAt: new Date(), refundBy: by, updatedAt: new Date() },
      });
      await addEvent(tx, id, { status: o.status, kind: 'payment', note: `Đã hoàn ${formatMoney(dto.amount)} cho khách`, by });
      return orderDto(await this.orders.load(tx, id));
    });
  }

  // Hoàn phần thu dư sau khi sửa đơn bớt hàng: khoản âm kèm ảnh chứng từ
  refundPart(id: string, dto: RefundDto, by: string) {
    return this.orders.prisma.$transaction(async (tx) => {
      const o = await this.orders.load(tx, id);
      const over = overpaid(o);
      if (!over) throw new BadRequestException('Đơn không thu dư.');
      if (dto.amount > over) throw new BadRequestException(`Chỉ thu dư ${formatMoney(over)}.`);
      await tx.payment.create({
        data: {
          id: rowId(id, `pay-${stamp()}`),
          orderId: id,
          provider: 'cod',
          amount: -dto.amount,
          status: 'success',
          isRefund: true,
          images: dto.images ?? [],
          note: dto.note?.trim() || null,
          createdAt: new Date(),
        },
      });
      await tx.order.update({ where: { id }, data: { updatedAt: new Date() } });
      await addEvent(tx, id, { status: o.status, kind: 'payment', note: `Hoàn ${formatMoney(dto.amount)} tiền thu dư`, by });
      return orderDto(await this.orders.load(tx, id));
    });
  }

  // Khiếu nại sau khi giao (đơn Hoàn tất): gửi bù (tạo đơn 0 ₫ vào thẳng Đã thanh toán, giữ nguyên liệu), hoàn một phần, hoặc chỉ ghi nhận
  complain(id: string, dto: ComplaintDto, by: string) {
    return this.orders.prisma.$transaction(async (tx) => {
      const o = await this.orders.load(tx, id);
      if (o.status !== 'completed') throw new BadRequestException('Chỉ ghi khiếu nại cho đơn Hoàn tất.');
      const at = new Date();
      const reason = dto.reason.trim();
      let replacement: { id: string; code: string } | undefined;
      if (dto.resolution === 'refund') {
        const max = Math.max(0, paidAmount(o));
        if (!dto.refundAmount) throw new BadRequestException('Nhập số tiền hoàn.');
        if (dto.refundAmount > max) throw new BadRequestException(`Hoàn tối đa ${formatMoney(max)} (số shop đang giữ của đơn).`);
        await tx.payment.create({
          data: {
            id: rowId(id, `pay-${stamp()}`),
            orderId: id,
            provider: 'cod',
            amount: -dto.refundAmount,
            status: 'success',
            isRefund: true,
            images: dto.refundImages ?? [],
            note: dto.refundNote?.trim() || null,
            createdAt: at,
          },
        });
      }
      if (dto.resolution === 'resend') {
        const items = (dto.picks ?? []).flatMap((p) => {
          const row = o.items.find((i) => itemDto(o.id, i).id === p.itemId);
          return row ? [{ row, quantity: Math.min(p.quantity, row.quantity) }] : [];
        });
        if (!items.length) throw new BadRequestException('Chọn ít nhất một cây để gửi bù.');
        if (!dto.readyDate) throw new BadRequestException('Chọn ngày làm xong của đơn gửi bù.');
        await assertAvailable(
          tx,
          items.map((x) => ({ productId: x.row.productId, recipe: x.row.recipe, quantity: x.quantity })),
        );
        const rid = `ord-${stamp()}`;
        replacement = { id: rid, code: await this.orders.nextCode(tx) };
        const s = stamp();
        await tx.order.create({
          data: {
            id: rid,
            code: replacement.code,
            status: 'paid',
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail,
            shippingAddress: o.shippingAddress,
            shippingMethod: o.shippingMethod,
            shippingName: o.shippingName,
            shippingDays: o.shippingDays,
            depositPercent: o.depositPercent,
            subtotal: 0,
            total: 0,
            paymentPlan: 'full',
            paymentMethod: 'cod',
            readyDate: dto.readyDate,
            internalNote: `Gửi bù cho đơn ${o.code}: ${reason}`,
            replacementForId: o.id,
            replacementForCode: o.code,
            createdAt: at,
            updatedAt: at,
            items: {
              createMany: {
                data: items.map(({ row, quantity }, i) => ({
                  id: rowId(rid, `${s}-${i}`),
                  sortOrder: i,
                  productId: row.productId,
                  name: row.name,
                  image: row.image,
                  price: 0,
                  quantity,
                  custom: row.custom,
                  craft: row.craft ?? undefined,
                  recipe: row.recipe ?? undefined,
                })),
              },
            },
          },
        });
        await addEvent(tx, rid, { status: 'paid', note: `Gửi bù cho đơn ${o.code} · ${reason}`, by, at });
      }
      await tx.complaint.create({
        data: {
          id: rowId(id, `cp-${stamp()}`),
          orderId: id,
          reason,
          images: dto.images ?? [],
          resolution: dto.resolution,
          refundAmount: dto.resolution === 'refund' ? dto.refundAmount : null,
          replacementId: replacement?.id ?? null,
          replacementCode: replacement?.code ?? null,
          at,
          by,
        },
      });
      const result = replacement ? `gửi bù đơn ${replacement.code}` : dto.resolution === 'refund' ? `hoàn ${formatMoney(dto.refundAmount ?? 0)}` : 'chỉ ghi nhận';
      await tx.order.update({ where: { id }, data: { updatedAt: at } });
      await addEvent(tx, id, { status: o.status, kind: 'complaint', note: `Khiếu nại: ${reason} · ${result}`, by, at });
      return { order: orderDto(await this.orders.load(tx, id)), replacement: replacement ? orderDto(await this.orders.load(tx, replacement.id)) : undefined };
    });
  }
}
