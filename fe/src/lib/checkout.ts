import type { CandleConfiguration } from "@/lib/customizer/types";
import type { CartItem } from "@/stores/cart-store";
import { unitPrice } from "@/stores/cart-store";
import type { Contact, PaymentMethod, PaymentPlan, ShippingMethod } from "@/stores/checkout-store";

export const FREE_SHIPPING_THRESHOLD = 100;
export const TAX_RATE = 0.1;

// days = số ngày giao sau khi xưởng làm xong
export const shippingMethods: { id: ShippingMethod; fee: number; days: number }[] = [
  { id: "standard", fee: 0, days: 3 },
  { id: "express", fee: 5, days: 1 },
];

// Mã giảm giá demo — BE sẽ kiểm tra lại khi tạo đơn
const discountCodes: Record<string, number> = {
  WELCOME10: 0.1,
  CANDLE2510: 0.15,
};

export const findDiscount = (code: string) => discountCodes[code.trim().toUpperCase()];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calcTotals(
  items: CartItem[],
  shipping: ShippingMethod,
  discountCode: string | null,
  plan: PaymentPlan = "full",
  depositRate = 0.5,
) {
  const subtotal = items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const rate = discountCode ? (findDiscount(discountCode) ?? 0) : 0;
  const discount = round2(subtotal * rate);
  const method = shippingMethods.find((m) => m.id === shipping)!;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : method.fee;
  const taxes = round2((subtotal - discount) * TAX_RATE);
  const total = round2(subtotal - discount + shippingFee + taxes);
  const dueNow = plan === "deposit" ? round2(total * depositRate) : total;
  return { subtotal, discount, shippingFee, taxes, total, dueNow, dueLater: round2(total - dueNow) };
}

export type CreateOrderInput = {
  // productId cho nến có sẵn mẫu, configuration cho nến tự phối (BE phải kiểm tra & tính lại giá)
  items: { productId: string; quantity: number; configuration?: CandleConfiguration }[];
  contact: Contact;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  paymentPlan: PaymentPlan;
  readyDate: string;
  discountCode: string | null;
  locale: string;
};

export type CreateOrderResult = {
  orderCode: string;
  // URL cổng VNPay / MoMo cho số tiền trả trước (cọc hoặc toàn bộ)
  payUrl?: string;
};

/**
 * Tạo đơn hàng ở BE (POST /api/orders). BE tự tính lại giá và trả về payUrl.
 * Chưa cấu hình NEXT_PUBLIC_API_URL thì giả lập để test giao diện.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    const res = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Create order failed: ${res.status}`);
    return res.json();
  }

  await new Promise((r) => setTimeout(r, 900));
  return { orderCode: `SC${Date.now().toString().slice(-8)}` };
}
