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
export type PaymentMethod = "vnpay" | "momo" | "cod";

type CheckoutState = {
  contact: Contact | null;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  discountCode: string | null;
  setContact: (contact: Contact) => void;
  setShipping: (shipping: ShippingMethod) => void;
  setPayment: (payment: PaymentMethod) => void;
  setDiscountCode: (code: string | null) => void;
};

// Ghi nhớ thông tin giao hàng cho lần mua sau
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      contact: null,
      shipping: "standard",
      payment: "vnpay",
      discountCode: null,
      setContact: (contact) => set({ contact }),
      setShipping: (shipping) => set({ shipping }),
      setPayment: (payment) => set({ payment }),
      setDiscountCode: (discountCode) => set({ discountCode }),
    }),
    {
      name: "scandleted-checkout",
      partialize: ({ contact, shipping, payment }) => ({ contact, shipping, payment }),
      skipHydration: true,
    },
  ),
);
