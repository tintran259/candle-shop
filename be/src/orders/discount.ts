// Kiểm tra và tính mã giảm giá như lúc khách nhập ở checkout — giống evaluateDiscount ở bo/src/lib/orders/create.ts
import type { Discount, DiscountCustomer } from '../generated/prisma/client.js';
import { normalizeCode } from '../discounts/discounts.module.js';
import { formatMoney, vnDay } from './money.js';

export type Line = { kind: 'product' | 'custom'; price: number; quantity: number };
type Code = Discount & { customers: DiscountCustomer[] };
type Previous = { status: string; discountCode: string | null };

export type DiscountResult = { discount?: Code; amount: number; error?: string };

const lineTotal = (l: Line) => Math.max(0, Math.round(l.price)) * Math.max(0, Math.round(l.quantity));

function status(d: Code, today = vnDay()) {
  if (!d.active) return 'Mã đang tạm dừng.';
  if (d.endsAt && d.endsAt < today) return 'Mã đã hết hạn.';
  if (d.usageLimit !== null && d.used >= d.usageLimit) return 'Mã đã hết lượt dùng.';
  if (d.startsAt > today) return 'Mã chưa tới ngày áp dụng.';
  return null;
}

// relaxed: sửa đơn giữ mã cũ — mã đã hợp lệ lúc đặt nên bỏ qua hạn dùng, số lượt, lần đầu, mã riêng; chỉ kiểm tra đơn tối thiểu và phạm vi
export function evaluateDiscount(input: { code?: string; d: Code | null; lines: Line[]; shippingFee: number; previous: Previous[]; customerId?: string; relaxed?: boolean }): DiscountResult {
  const { d, lines, shippingFee, relaxed } = input;
  if (!normalizeCode(input.code)) return { amount: 0 };
  if (!d) return { amount: 0, error: 'Không có mã này.' };
  const blocked = relaxed ? null : status(d);
  if (blocked) return { amount: 0, error: blocked };
  const ids = d.customers.map((c) => c.customerId);
  if (!relaxed && ids.length && !(input.customerId && ids.includes(input.customerId)))
    return { amount: 0, error: input.customerId ? 'Mã này dành riêng cho khách khác.' : 'Mã dành riêng cho khách được chọn — nhập đúng số điện thoại của khách.' };
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  if (d.minOrder && subtotal < d.minOrder) return { amount: 0, error: `Đơn từ ${formatMoney(d.minOrder)} mới dùng được mã này.` };
  const valid = input.previous.filter((o) => o.status !== 'cancelled');
  if (!relaxed && d.firstOrderOnly && valid.length) return { amount: 0, error: 'Mã chỉ dành cho khách đặt lần đầu.' };
  if (!relaxed && d.perCustomerLimit && valid.filter((o) => o.discountCode === d.code).length >= d.perCustomerLimit) return { amount: 0, error: 'Khách đã dùng hết lượt của mã này.' };
  if (d.type === 'freeship') return shippingFee ? { discount: d, amount: shippingFee } : { amount: 0, error: 'Đơn đang miễn phí giao — mã không có tác dụng.' };
  // Phạm vi: chỉ tính trên các dòng phù hợp
  const base = lines.filter((l) => d.scope === 'all' || (d.scope === 'products' ? l.kind === 'product' : l.kind === 'custom')).reduce((s, l) => s + lineTotal(l), 0);
  if (!base) return { amount: 0, error: d.scope === 'products' ? 'Mã chỉ áp dụng cho nến có sẵn.' : 'Mã chỉ áp dụng cho nến tự phối.' };
  const raw = d.type === 'percent' ? Math.round((base * d.value) / 100 / 1000) * 1000 : d.value;
  return { discount: d, amount: Math.min(base, d.type === 'percent' && d.maxDiscount ? Math.min(raw, d.maxDiscount) : raw) };
}
