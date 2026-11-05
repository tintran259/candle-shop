// Doanh thu và lãi của đơn (docs/pages/dashboard.md#quy-tắc-doanh-thu).
// Phí vận chuyển khách trả (phí giao + phí gửi lại) là tiền thu để trả đơn vị vận chuyển, không phải doanh thu.
// Tiền shop trả đơn vị vận chuyển (shippingCost) là chi phí, trừ vào lãi.
import { goodsValue } from "@/lib/costs";
import type { Order } from "@/lib/orders/types";

export type MoneyEntry = { at: string; amount: number };

// Chia tiền đã thu của đơn: tiền hàng trước, rồi phí vận chuyển, phần còn lại là thu dư (sau khi sửa đơn bớt hàng).
// Hoàn một phần (thu dư, khiếu nại): trả phần thu dư trước, rồi tiền hàng. Hoàn khi hủy: thu dư, rồi phí vận chuyển, rồi tiền hàng.
// entries: các khoản tiền hàng theo ngày phát sinh (âm = hoàn) — cộng lại là doanh thu của đơn
export function orderMoney(o: Order) {
  const goodsCap = Math.max(0, o.total - (o.shippingFee ?? 0));
  const shipCap = Math.max(0, o.shippingFee ?? 0);
  let goods = 0;
  let shipping = 0;
  let extra = 0;
  const entries: MoneyEntry[] = [];
  const paid = o.payments.filter((p) => p.status === "success").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const p of paid) {
    if (p.amount >= 0) {
      const g = Math.min(p.amount, Math.max(0, goodsCap - goods));
      const s = Math.min(p.amount - g, Math.max(0, shipCap - shipping));
      goods += g;
      shipping += s;
      extra += p.amount - g - s;
      if (g) entries.push({ at: p.createdAt, amount: g });
    } else {
      let r = -p.amount;
      const e = Math.min(r, extra);
      extra -= e;
      r -= e;
      const g = Math.min(r, goods);
      goods -= g;
      r -= g;
      shipping -= Math.min(r, shipping);
      if (g) entries.push({ at: p.createdAt, amount: -g });
    }
  }
  // Đơn hủy: trừ số đã hoàn, hoặc số đang chờ hoàn để không ghi nhận khoản sắp trả lại
  const back = o.status === "cancelled" ? (o.refund?.amount ?? o.refundDue ?? 0) : 0;
  if (back) {
    let r = back;
    const e = Math.min(r, extra);
    r -= e;
    const s = Math.min(r, shipping);
    shipping -= s;
    r -= s;
    const g = Math.min(r, goods);
    goods -= g;
    if (g) entries.push({ at: o.refund?.at ?? o.updatedAt, amount: -g });
  }
  return { entries, goods, shipping };
}

// Lãi của đơn. material: giá vốn nguyên liệu (lib/costs › orderCost).
// - Đơn chưa hủy: giá trị hàng − nguyên liệu + (phí vận chuyển khách trả − phí trả đơn vị vận chuyển). Chưa giao thì chưa tính phần vận chuyển.
// - Đơn hủy: tiền hàng giữ lại (vd tiền cọc) + phí vận chuyển khách đã trả − phí trả đơn vị vận chuyển − nguyên liệu đã mất
//   (đã Bắt đầu làm mà không hoàn về Kho, không chuyển sang Sản phẩm hủy đơn)
export function orderProfit(o: Order, material: number) {
  const carrier = o.shippingCost ?? 0;
  if (o.status === "cancelled") {
    const money = orderMoney(o);
    const lost = o.materialCost !== undefined && o.cancelOutcome !== "returned" && o.cancelOutcome !== "stocked" ? material : 0;
    const shipping = money.shipping - carrier;
    return { value: money.goods, material: lost, shipping, carrier, profit: money.goods - lost + shipping };
  }
  const value = goodsValue(o);
  const shipping = o.shippingCost !== undefined ? (o.shippingFee ?? 0) - carrier : 0;
  return { value, material, shipping, carrier, profit: value - material + shipping };
}
