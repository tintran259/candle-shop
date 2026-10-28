import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data";

export type CartItem = Pick<
  Product,
  "id" | "name" | "image" | "price" | "salePrice"
> & { quantity: number };

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      setOpen: (isOpen) => set({ isOpen }),
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            };
          }
          const { id, name, image, price, salePrice } = product;
          return {
            items: [
              ...state.items,
              { id, name, image, price, salePrice, quantity },
            ],
          };
        }),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "scandleted-cart",
      partialize: (state) => ({ items: state.items }),
      // Rehydrate ở client (Providers) để tránh lệch HTML giữa server và client
      skipHydration: true,
    },
  ),
);

export const unitPrice = (item: Pick<CartItem, "price" | "salePrice">) =>
  item.salePrice ?? item.price;

export const selectCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);
