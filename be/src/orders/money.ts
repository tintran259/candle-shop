// Tiền của đơn — giống bo/src/lib/orders/labels.ts và create.ts. VNĐ, số nguyên
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
export const formatMoney = (n: number) => money.format(Math.round(n));

type Pay = { amount: number; status: string; isRefund?: boolean };
type Money = { total: number; shippingFee: number; depositPercent: number | null; status: string; payments: Pay[] };

export const DEFAULT_DEPOSIT = 50;

export const paidAmount = (o: Pick<Money, 'payments'>) => o.payments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);
export const remaining = (o: Pick<Money, 'payments' | 'total'>) => Math.max(0, o.total - paidAmount(o));
// Khách đã trả nhiều hơn tổng đơn (sửa đơn bớt hàng) — phần cần hoàn
export const overpaid = (o: Pick<Money, 'payments' | 'total' | 'status'>) => (o.status === 'cancelled' ? 0 : Math.max(0, paidAmount(o) - o.total));

// Tiền cọc làm tròn tới nghìn đồng, ít nhất 1.000 ₫ và không quá tổng. Cọc tính trên tiền hàng, không gồm phí giao
export const depositAmount = (total: number, percent: number) => (total > 0 && percent > 0 ? Math.min(total, Math.max(1000, Math.round((total * percent) / 100 / 1000) * 1000)) : 0);

// Hủy đơn đã thu tiền: lỗi do shop hoàn hết; lỗi do khách giữ phần cọc (trên tiền hàng, không gồm phí giao, phí gửi lại)
export function refundFor(o: Money, fault: 'customer' | 'shop') {
  const paid = paidAmount(o);
  if (fault === 'shop') return paid;
  return Math.max(0, paid - depositAmount(Math.max(0, o.total - o.shippingFee), o.depositPercent ?? DEFAULT_DEPOSIT));
}

// Ngày theo giờ Việt Nam
export const vnDay = (d = new Date()) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
export const viDate = (day: string) => day.split('-').reverse().join('/');
