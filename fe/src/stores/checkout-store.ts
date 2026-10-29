import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Contact = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

export type ShippingMethod = "standard" | "express";
export type PaymentMethod = "vnpay" | "momo";
// Trả đủ ngay, hoặc cọc trước phần còn lại trả khi nhận hàng
export type PaymentPlan = "full" | "deposit";

type CheckoutState = {
  contact: Contact | null;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  paymentPlan: PaymentPlan;
  // Ngày xưởng hoàn thành khách đã chọn (YYYY-MM-DD)
  readyDate: string | null;
  discountCode: string | null;
  setContact: (contact: Contact) => void;
  setShipping: (shipping: ShippingMethod) => void;
  setPayment: (payment: PaymentMethod) => void;
  setPaymentPlan: (plan: PaymentPlan) => void;
  setReadyDate: (date: string | null) => void;
  setDiscountCode: (code: string | null) => void;
};

// Ghi nhớ thông tin giao hàng cho lần mua sau
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      contact: null,
      shipping: "standard",
      payment: "vnpay",
      paymentPlan: "deposit",
      readyDate: null,
      discountCode: null,
      setContact: (contact) => set({ contact }),
      setShipping: (shipping) => set({ shipping }),
      setPayment: (payment) => set({ payment }),
      setPaymentPlan: (paymentPlan) => set({ paymentPlan }),
      setReadyDate: (readyDate) => set({ readyDate }),
      setDiscountCode: (discountCode) => set({ discountCode }),
    }),
    {
      name: "scandleted-checkout",
      partialize: ({ contact, shipping, payment, paymentPlan }) => ({ contact, shipping, payment, paymentPlan }),
      version: 2,
      // Bản cũ có thể lưu "cod" — giờ thanh toán trước qua VNPay/MoMo
      migrate: (state) => {
        const s = state as Partial<CheckoutState> & { payment?: string };
        return { ...s, payment: s.payment === "momo" ? "momo" : "vnpay" } as CheckoutState;
      },
      skipHydration: true,
    },
  ),
);
