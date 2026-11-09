// Các bước của đơn (docs/workflow.md) — giống bo/src/hooks/use-orders.ts:
// Chờ thanh toán → Đã thanh toán → Đang làm → Chờ giao → Đang giao → Hoàn tất, và nhánh giao không thành / hoàn về / gửi lại
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { Order } from '../generated/prisma/client.js';
import { formatMoney, remaining, viDate } from './money.js';
import type { ResendDto, ReturnDto, ShipDto } from './orders.dto.js';
import { addEvent, orderDto, rowId, stamp, type EventKind, type OrderRow } from './orders.map.js';
import { OrdersService, type Tx } from './orders.service.js';
import { consumeOrder } from './order-stock.js';

type Status = Order['status'];
const FLOW: Status[] = ['pending', 'paid', 'producing', 'ready', 'shipping', 'completed'];
const LABEL: Record<Status, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  producing: 'Đang làm',
  ready: 'Chờ giao',
  shipping: 'Đang giao',
  completed: 'Hoàn tất',
  delivery_failed: 'Giao không thành',
  returning: 'Đang hoàn về',
  returned: 'Đã hoàn về',
  cancelled: 'Đã hủy',
};
const CONDITION = { good: 'Nến còn tốt', damaged: 'Nến bị hỏng' };

// "Giao Hàng Nhanh · mã vận đơn GHN123 · phí vận chuyển 30.000 ₫"
const shipmentText = (s: { carrier: string; trackingCode?: string | null }) => (s.trackingCode ? `${s.carrier} · mã vận đơn ${s.trackingCode}` : s.carrier);
const shipmentNote = (s: { carrier: string; trackingCode?: string | null; cost?: number | null }) => (s.cost != null ? `${shipmentText(s)} · phí vận chuyển ${formatMoney(s.cost)}` : shipmentText(s));
const normalizeTrackingCode = (s = '') => s.replace(/\s+/g, '').toUpperCase();

@Injectable()
export class OrderFlowService {
  constructor(private readonly orders: OrdersService) {}

  // Khung chung: khóa trạng thái được phép, đổi đơn, ghi lịch sử, trả đơn mới
  private run(id: string, allowed: Status[], fn: (tx: Tx, o: OrderRow) => Promise<{ data?: object; event?: { status?: Status; note?: string; kind?: EventKind } } | void>, by: string) {
    return this.orders.prisma.$transaction(async (tx) => {
      const o = await this.orders.load(tx, id);
      if (!allowed.includes(o.status)) throw new BadRequestException(`Đơn đang ${LABEL[o.status]} — không làm được thao tác này.`);
      const r = (await fn(tx, o)) ?? {};
      await tx.order.update({ where: { id }, data: { ...r.data, updatedAt: new Date() } });
      if (r.event) await addEvent(tx, id, { status: r.event.status ?? o.status, note: r.event.note, kind: r.event.kind ?? 'status', by });
      return orderDto(await this.orders.load(tx, id));
    });
  }

  // Bước kế tiếp. Xác nhận thanh toán: khoản đang chờ thành công. Bắt đầu làm: trừ Kho, chốt giá vốn.
  // Khách đã nhận: ghi đã thu phần còn lại. Chờ giao → Đang giao dùng ship() (cần đơn vị, mã vận đơn)
  advance(id: string, by: string) {
    return this.run(
      id,
      ['pending', 'paid', 'producing', 'shipping'],
      async (tx, o) => {
        const to = FLOW[FLOW.indexOf(o.status) + 1];
        if (to === 'paid') await tx.payment.updateMany({ where: { orderId: id, status: 'pending' }, data: { status: 'success' } });
        if (to === 'producing') return { data: { status: to, materialCost: await consumeOrder(tx, o, by) }, event: { status: to } };
        if (to === 'completed') {
          const left = remaining(o);
          if (left) {
            await tx.payment.create({ data: { id: rowId(id, `pay-${stamp()}`), orderId: id, provider: 'cod', amount: left, status: 'success', createdAt: new Date() } });
            await addEvent(tx, id, { status: o.status, kind: 'payment', note: `Thu nốt ${formatMoney(left)} khi giao`, by });
          }
        }
        return { data: { status: to }, event: { status: to } };
      },
      by,
    );
  }

  // Đơn vị theo Cài đặt (chụp tên, link tra cứu). Mã vận đơn bắt buộc nếu đơn vị yêu cầu, không trùng đơn khác chưa hủy
  private async shipment(tx: Tx, o: OrderRow, dto: ShipDto) {
    const settings = await this.orders.settings.get();
    const carrierId = dto.carrierId ?? o.carrierId;
    const carrier = settings.carriers.find((c) => c.id === carrierId);
    if (!carrier) throw new BadRequestException('Chọn đơn vị vận chuyển.');
    const code = normalizeTrackingCode(dto.trackingCode);
    if (carrier.requireCode && !code) throw new BadRequestException(`Nhập mã vận đơn của ${carrier.name}.`);
    if (code) {
      const owner = await tx.order.findFirst({ where: { id: { not: o.id }, status: { not: 'cancelled' }, trackingCode: code } });
      if (owner) throw new ConflictException({ message: `Mã vận đơn ${code} đã dùng cho đơn ${owner.code}.`, orderId: owner.id });
    }
    const url = carrier.trackingUrl?.includes('{code}') && code ? carrier.trackingUrl.replace(/\{code\}/g, encodeURIComponent(code)) : null;
    const s = { shipCarrierId: carrier.id, shipCarrier: carrier.name, trackingCode: code || null, trackingUrl: url, shipCost: dto.cost ?? null, shippedAt: new Date() };
    return { s, note: shipmentNote({ carrier: carrier.name, trackingCode: code, cost: dto.cost }) };
  }

  // Giao cho vận chuyển: Chờ giao → Đang giao. Phí lượt này cộng vào tổng phí shop đã trả
  ship(id: string, dto: ShipDto, by: string) {
    return this.run(
      id,
      ['ready'],
      async (tx, o) => {
        const { s, note } = await this.shipment(tx, o, dto);
        return { data: { ...s, status: 'shipping', shippingCost: (o.shippingCost ?? 0) + (dto.cost ?? 0) }, event: { status: 'shipping', note } };
      },
      by,
    );
  }

  // Sửa đơn vị / mã vận đơn / phí của lượt giao hiện tại; phí đổi thì bù phần chênh vào tổng phí đã trả
  updateShipment(id: string, dto: ShipDto, by: string) {
    return this.run(
      id,
      ['shipping', 'delivery_failed', 'returning', 'returned', 'completed'],
      async (tx, o) => {
        if (!o.shipCarrierId) throw new BadRequestException('Đơn chưa giao cho vận chuyển.');
        const { s, note } = await this.shipment(tx, o, { carrierId: dto.carrierId ?? o.shipCarrierId, trackingCode: dto.trackingCode, cost: dto.cost });
        const before = shipmentNote({ carrier: o.shipCarrier ?? '', trackingCode: o.trackingCode, cost: o.shipCost });
        return {
          data: { ...s, shippedAt: o.shippedAt, shippingCost: (o.shippingCost ?? 0) - (o.shipCost ?? 0) + (dto.cost ?? 0) },
          event: { kind: 'delivery', note: `Đổi vận chuyển: ${before} → ${note}` },
        };
      },
      by,
    );
  }

  // Giao không thành; hết số lần giao trong Cài đặt thì tự chuyển Đang hoàn về
  async failDelivery(id: string, reason: string, by: string) {
    const max = (await this.orders.settings.get()).maxDeliveryAttempts;
    return this.run(
      id,
      ['shipping'],
      async (tx, o) => {
        const n = (o.deliveryAttempts ?? 0) + 1;
        const issue = reason.trim();
        await addEvent(tx, id, { status: 'delivery_failed', note: `Lần ${n}/${max}: ${issue}`, by });
        if (n < max) return { data: { status: 'delivery_failed', deliveryAttempts: n, deliveryIssue: issue } };
        return { data: { status: 'returning', deliveryAttempts: n, deliveryIssue: issue }, event: { status: 'returning', note: `Hết ${max} lần giao` } };
      },
      by,
    );
  }

  redeliver(id: string, by: string) {
    return this.run(
      id,
      ['delivery_failed'],
      async (_tx, o) => {
        const note = [`Giao lại lần ${(o.deliveryAttempts ?? 0) + 1}`, o.shipCarrier && shipmentText({ carrier: o.shipCarrier, trackingCode: o.trackingCode })].filter(Boolean).join(' · ');
        return { data: { status: 'shipping' }, event: { status: 'shipping', kind: 'delivery', note } };
      },
      by,
    );
  }

  startReturn(id: string, by: string) {
    return this.run(id, ['delivery_failed'], async () => ({ data: { status: 'returning' }, event: { status: 'returning' } }), by);
  }

  // Hàng về shop. returnFee: phí hoàn hàng shop trả đơn vị vận chuyển, cộng vào chi phí vận chuyển
  receiveReturn(id: string, dto: ReturnDto, by: string) {
    return this.run(
      id,
      ['returning'],
      async (_tx, o) => {
        const fee = dto.returnFee ?? 0;
        const note = [CONDITION[dto.condition], dto.note?.trim(), fee && `phí hoàn hàng ${fee.toLocaleString('vi-VN')} ₫`].filter(Boolean).join(' · ');
        return {
          data: { status: 'returned', returnCondition: dto.condition, returnNote: dto.note?.trim() || null, ...(fee && { shippingCost: (o.shippingCost ?? 0) + fee }) },
          event: { status: 'returned', note },
        };
      },
      by,
    );
  }

  // Hàng về rồi gửi lại: đơn vị, mã vận đơn mới, chuyển thẳng Đang giao. Đếm lại số lần giao; phí gửi lại cộng vào đơn
  async resend(id: string, dto: ResendDto, by: string) {
    const fee = dto.fee ?? (await this.orders.settings.get()).resendFee;
    return this.run(
      id,
      ['returned'],
      async (tx, o) => {
        const { s, note } = await this.shipment(tx, o, dto);
        return {
          data: {
            ...s,
            status: 'shipping',
            shippingCost: (o.shippingCost ?? 0) + (dto.cost ?? 0),
            deliveryAttempts: 0,
            deliveryIssue: null,
            returnCondition: null,
            returnNote: null,
            shippingFee: o.shippingFee + fee,
            total: o.total + fee,
            resendFee: (o.resendFee ?? 0) + fee,
          },
          event: { status: 'shipping', kind: 'delivery', note: `Gửi lại đơn · khách trả thêm ${fee.toLocaleString('vi-VN')} ₫ · ${note}` },
        };
      },
      by,
    );
  }

  reschedule(id: string, readyDate: string, by: string) {
    return this.run(
      id,
      ['pending', 'paid', 'producing'],
      async (_tx, o) => (o.readyDate === readyDate ? {} : { data: { readyDate }, event: { kind: 'schedule', note: `Ngày làm xong mới: ${viDate(readyDate)}` } }),
      by,
    );
  }

  setInternalNote(id: string, note: string, by: string) {
    return this.run(id, [...FLOW, 'delivery_failed', 'returning', 'returned', 'cancelled'], async () => ({ data: { internalNote: note.trim() || null } }), by);
  }
}
