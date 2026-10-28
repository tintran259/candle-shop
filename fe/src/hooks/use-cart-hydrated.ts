import { useSyncExternalStore } from "react";
import { useCartStore } from "@/stores/cart-store";

/** true khi giỏ hàng đã đọc xong từ localStorage (tránh chớp "giỏ trống") */
export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}
