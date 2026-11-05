// Khiếu nại sau khi giao (đơn Hoàn tất): gửi bù nến mới, hoàn một phần tiền, hoặc chỉ ghi nhận (docs/workflow.md mục 7)
import dayjs from "dayjs";
import { formatMoney } from "@/lib/format";
import { nextOrderCode } from "@/lib/orders/create";
import { paidAmount } from "@/lib/orders/labels";
import type { Complaint, ComplaintResolution, Order } from "@/lib/orders/types";

export const resolutionLabels: Record<ComplaintResolution, string> = {
  resend: "Gửi bù nến mới",
  refund: "Hoàn một phần tiền",
  none: "Chỉ ghi nhận",
};

// Hoàn tối đa số tiền shop đang giữ của đơn (đã trừ các khoản hoàn trước)
export const maxComplaintRefund = (order: Order) => Math.max(0, paidAmount(order));

// Đơn gửi bù: cùng khách, địa chỉ, các cây được chọn với giá 0 ₫. Vào thẳng Đã thanh toán để giữ nguyên liệu và đi qua đủ các bước làm, giao
export function buildReplacement(order: Order, picks: { itemId: string; quantity: number }[], input: { readyDate: string; reason: string; by: string }, orders: Order[], at = dayjs()): Order {
  const stamp = at.valueOf().toString(36);
  const items = picks
    .filter((p) => p.quantity > 0)
    .flatMap((p, i) => {
      const item = order.items.find((x) => x.id === p.itemId);
      return item ? [{ ...item, id: `${stamp}-${i}`, price: 0, quantity: Math.min(p.quantity, item.quantity) }] : [];
    });
  const iso = at.toISOString();
  return {
    id: `ord-${stamp}`,
    code: nextOrderCode(orders, at),
    status: "paid",
    customer: order.customer,
    shippingAddress: order.shippingAddress,
    shippingMethod: order.shippingMethod,
    shippingName: order.shippingName,
    shippingDays: order.shippingDays,
    depositPercent: order.depositPercent,
    items,
    subtotal: 0,
    discount: 0,
    shippingFee: 0,
    total: 0,
    paymentPlan: "full",
    paymentMethod: "cod",
    payments: [],
    readyDate: input.readyDate,
    internalNote: `Gửi bù cho đơn ${order.code}: ${input.reason}`,
    replacementFor: { id: order.id, code: order.code },
    history: [{ at: iso, status: "paid", note: `Gửi bù cho đơn ${order.code} · ${input.reason}`, by: input.by }],
    createdAt: iso,
    updatedAt: iso,
  };
}

// Ghi khiếu nại lên đơn gốc; hoàn một phần thì thêm khoản hoàn (số âm) để doanh thu trừ vào ngày hoàn
export function recordComplaint(
  order: Order,
  input: { reason: string; images: string[]; resolution: ComplaintResolution; refundAmount?: number; refundImages?: string[]; refundNote?: string; replacement?: Order; by: string },
  at = dayjs(),
): Order {
  const iso = at.toISOString();
  const complaint: Complaint = {
    id: `cp-${at.valueOf().toString(36)}`,
    reason: input.reason.trim(),
    images: input.images,
    resolution: input.resolution,
    refundAmount: input.resolution === "refund" ? input.refundAmount : undefined,
    replacementId: input.replacement?.id,
    replacementCode: input.replacement?.code,
    at: iso,
    by: input.by,
  };
  const refund =
    input.resolution === "refund" && input.refundAmount
      ? [
          {
            id: `pay-${at.valueOf().toString(36)}`,
            provider: "cod" as const,
            amount: -Math.round(input.refundAmount),
            status: "success" as const,
            kind: "refund" as const,
            images: input.refundImages ?? [],
            note: input.refundNote?.trim() || undefined,
            createdAt: iso,
          },
        ]
      : [];
  const result =
    input.resolution === "resend" && input.replacement ? `gửi bù đơn ${input.replacement.code}` : input.resolution === "refund" ? `hoàn ${formatMoney(input.refundAmount ?? 0)}` : "chỉ ghi nhận";
  return {
    ...order,
    complaints: [...(order.complaints ?? []), complaint],
    payments: [...order.payments, ...refund],
    history: [...order.history, { at: iso, kind: "complaint", status: order.status, note: `Khiếu nại: ${complaint.reason} · ${result}`, by: input.by }],
    updatedAt: iso,
  };
}
