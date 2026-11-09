// Đơn hàng: xem, tạo tại BO, sửa đơn (docs/pages/orders.md). Tiền tính lại ở BE: tạm tính theo giá từng dòng BO gửi
// (giá nến tự phối BO tính theo Thủ công), giảm giá tính lại theo mã, cọc theo % Cài đặt. Kho kiểm tra trên phần còn dùng được
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { phoneKey } from '../common/text.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { evaluateDiscount } from './discount.js';
import { depositAmount, formatMoney, vnDay } from './money.js';
import { CHANNELS, type CreateOrderDto, type LineDto } from './orders.dto.js';
import { addEvent, orderDto, rowId, stamp, withAll, type OrderRow } from './orders.map.js';
import { assertAvailable } from './order-stock.js';

export type Tx = Prisma.TransactionClient;
const clean = (s?: string) => s?.trim() || null;
const lineTotal = (l: { price: number; quantity: number }) => l.price * l.quantity;
export const BO_ORDER_NOTE = 'Tạo đơn tại BO';

@Injectable()
export class OrdersService {
  constructor(
    readonly prisma: PrismaService,
    readonly settings: SettingsService,
  ) {}

  async list(status?: string) {
    const rows = await this.prisma.order.findMany({ where: status ? { status: status as OrderRow['status'] } : {}, include: withAll, orderBy: { createdAt: 'desc' } });
    return (rows as OrderRow[]).map(orderDto);
  }

  async get(id: string) {
    return orderDto(await this.load(this.prisma, id));
  }

  async load(tx: Tx, id: string): Promise<OrderRow> {
    const row = await tx.order.findUnique({ where: { id }, include: withAll });
    if (!row) throw new NotFoundException('Không tìm thấy đơn hàng.');
    return row as OrderRow;
  }

  // Mã đơn như web: SC + YYMMDD (giờ Việt Nam) + số thứ tự trong ngày
  async nextCode(tx: Tx) {
    const prefix = `SC${vnDay().slice(2).replace(/-/g, '')}`;
    const used = new Set((await tx.order.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } })).map((o) => o.code));
    for (let n = used.size + 1; ; n++) {
      const code = `${prefix}${String(n).padStart(3, '0')}`;
      if (!used.has(code)) return code;
    }
  }

  // Hồ sơ khách theo số điện thoại (so theo chữ số)
  async profile(tx: Tx, phone: string) {
    const key = phoneKey(phone);
    return (await tx.customer.findMany()).find((c) => phoneKey(c.phone) === key);
  }

  // Khách chưa có hồ sơ thì tạo hồ sơ khách vãng lai
  async ensureProfile(tx: Tx, orderId: string, c: { name: string; phone: string; email?: string }) {
    if (await this.profile(tx, c.phone)) return false;
    const base = `cus-${orderId.replace('ord-', '')}`;
    const id = (await tx.customer.findUnique({ where: { id: base } })) ? `${base}-${stamp()}` : base;
    await tx.customer.create({ data: { id, name: c.name.trim(), phone: c.phone.trim(), email: c.email?.trim() ?? '' } });
    return true;
  }

  // Dòng gửi lên → dòng lưu. Nến có sẵn lấy tên / ảnh của sản phẩm nếu không gửi; nến tự phối cần mô tả và công thức
  async items(tx: Tx, orderId: string, lines: LineDto[]) {
    const s = stamp();
    const out: Prisma.OrderItemCreateManyOrderInput[] = [];
    for (const [i, l] of lines.entries()) {
      if (l.kind === 'product') {
        const p = l.productId ? await tx.product.findUnique({ where: { id: l.productId } }) : null;
        if (!p) throw new BadRequestException(`Dòng ${i + 1}: không tìm thấy sản phẩm.`);
        out.push({ id: rowId(orderId, `${s}-${i}`), sortOrder: i, productId: p.id, name: l.name?.trim() || p.name, image: l.image ?? p.images[0] ?? null, price: l.price, quantity: l.quantity });
      } else {
        if (!l.custom?.trim()) throw new BadRequestException(`Dòng ${i + 1}: nến tự phối cần mô tả cấu hình.`);
        if (!l.recipe) throw new BadRequestException(`Dòng ${i + 1}: nến tự phối cần công thức để giữ và trừ Kho.`);
        out.push({
          id: rowId(orderId, `${s}-${i}`),
          sortOrder: i,
          name: 'Nến tự phối',
          price: l.price,
          quantity: l.quantity,
          custom: l.custom.trim(),
          craft: (l.craft ?? undefined) as Prisma.InputJsonValue | undefined,
          recipe: l.recipe.map((r) => ({ materialId: r.materialId, quantity: r.quantity })),
        });
      }
    }
    return out;
  }

  // Mã giảm giá theo quy tắc checkout. relaxedCode: mã cũ của đơn đang sửa
  async discount(tx: Tx, a: { code?: string; lines: LineDto[]; shippingFee: number; phone: string; selfId?: string; relaxedCode?: string | null }) {
    const code = a.code
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (!code) return { amount: 0, code: null as string | null, id: null as string | null };
    const d = await tx.discount.findFirst({ where: { code }, include: { customers: true } });
    const key = phoneKey(a.phone);
    const previous = (
      await tx.order.findMany({ where: { replacementForId: null, ...(a.selfId && { id: { not: a.selfId } }) }, select: { status: true, discountCode: true, customerPhone: true } })
    ).filter((o) => phoneKey(o.customerPhone) === key);
    const r = evaluateDiscount({ code, d, lines: a.lines, shippingFee: a.shippingFee, previous, customerId: (await this.profile(tx, a.phone))?.id, relaxed: !!d && d.code === a.relaxedCode });
    if (r.error) throw new BadRequestException(`Mã giảm giá: ${r.error}`);
    return { amount: r.amount, code: r.discount!.code, id: r.discount!.id };
  }

  async create(dto: CreateOrderDto, by: string) {
    const settings = await this.settings.get();
    const option = settings.shippingOptions.find((o) => o.id === dto.shippingMethod);
    if (!option) throw new BadRequestException('Không có phương thức giao này.');
    const carrier = dto.carrierId ? settings.carriers.find((c) => c.id === dto.carrierId) : undefined;
    if (dto.carrierId && !carrier) throw new BadRequestException('Không có đơn vị vận chuyển này.');
    const shippingFee = dto.shippingFee ?? option.fee;
    return this.prisma.$transaction(async (tx) => {
      const profile = await this.profile(tx, dto.customer.phone);
      if (profile?.blocked && !dto.allowBlocked)
        throw new ConflictException({ message: `${profile.name} đang bị chặn đặt hàng${profile.blockReason ? `: ${profile.blockReason}` : ''}.`, customerId: profile.id, blocked: true });
      await assertAvailable(
        tx,
        dto.lines.map((l) => ({ productId: l.productId, recipe: l.recipe, quantity: l.quantity })),
      );
      const d = await this.discount(tx, { code: dto.discountCode, lines: dto.lines, shippingFee, phone: dto.customer.phone });
      const id = `ord-${stamp()}`;
      const subtotal = dto.lines.reduce((s, l) => s + lineTotal(l), 0);
      const total = Math.max(0, subtotal - d.amount + shippingFee);
      // Cọc tính trên tiền hàng (tạm tính − giảm giá), phí giao thu cùng phần còn lại khi giao
      const dueNow = dto.paymentPlan === 'deposit' ? depositAmount(Math.max(0, subtotal - d.amount), settings.depositPercent) : total;
      const at = new Date();
      const items = await this.items(tx, id, dto.lines);
      await tx.order.create({
        data: {
          id,
          code: await this.nextCode(tx),
          status: dto.received ? 'paid' : 'pending',
          customerName: dto.customer.name.trim(),
          customerPhone: dto.customer.phone.trim(),
          customerEmail: dto.customer.email?.trim() ?? '',
          shippingAddress: dto.shippingAddress.trim(),
          shippingMethod: option.id,
          shippingName: `${option.name} (${option.days} ngày)`,
          shippingDays: option.days,
          carrierId: carrier?.id ?? null,
          carrierName: carrier?.name ?? null,
          depositPercent: settings.depositPercent,
          subtotal,
          discount: d.amount,
          discountCode: d.code,
          shippingFee,
          total,
          paymentPlan: dto.paymentPlan,
          paymentMethod: dto.paymentMethod,
          readyDate: dto.readyDate,
          note: clean(dto.note),
          internalNote: clean(dto.internalNote),
          createdAt: at,
          updatedAt: at,
          items: { createMany: { data: items } },
          payments: {
            create: {
              id: rowId(id, `pay-${stamp()}`),
              provider: dto.paymentMethod,
              amount: dueNow,
              status: dto.received ? 'success' : 'pending',
              transactionId: dto.received ? clean(dto.transactionId) : null,
              createdAt: at,
            },
          },
        },
      });
      await addEvent(tx, id, { status: 'pending', note: `${BO_ORDER_NOTE} · ${CHANNELS[dto.channel]}`, by, at });
      if (dto.received) await addEvent(tx, id, { status: 'paid', note: dto.paymentPlan === 'deposit' ? `Nhận cọc ${formatMoney(dueNow)}` : 'Thanh toán đủ', by, at });
      if (d.id) await tx.discount.update({ where: { id: d.id }, data: { used: { increment: 1 } } });
      const createdCustomer = await this.ensureProfile(tx, id, dto.customer);
      return { order: orderDto(await this.load(tx, id)), createdCustomer };
    });
  }

  // Trả một lượt mã (hủy đơn, đổi mã khi sửa đơn)
  async releaseDiscount(tx: Tx, code: string | null) {
    if (!code) return;
    const d = await tx.discount.findUnique({ where: { code } });
    if (d && d.used > 0) await tx.discount.update({ where: { id: d.id }, data: { used: d.used - 1 } });
  }
}
