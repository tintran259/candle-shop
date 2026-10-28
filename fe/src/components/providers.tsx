"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    useCartStore.persist.rehydrate();
    useCheckoutStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ReactLenis root options={{ lerp: 0.1, anchors: true }}>
          {children}
        </ReactLenis>
        <Toaster position="bottom-right" theme="light" />
      </MotionConfig>
    </QueryClientProvider>
  );
}
