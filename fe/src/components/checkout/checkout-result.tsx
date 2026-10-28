"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

/**
 * Trang đích sau thanh toán: ?status=success|failed&code=...
 * (VNPAY_RETURN_URL / MOMO_REDIRECT_URL của BE trỏ về đây)
 */
export function CheckoutResult() {
  const t = useTranslations("Checkout.result");
  const params = useSearchParams();
  const clear = useCartStore((s) => s.clear);
  const success = params.get("status") === "success";
  const code = params.get("code") ?? "";

  useEffect(() => {
    if (success) clear();
  }, [success, clear]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-4 py-20 text-center">
      <motion.span
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={cn(
          "flex size-20 items-center justify-center rounded-full text-white",
          success ? "bg-peanut" : "bg-rose",
        )}
      >
        {success ? <CheckIcon className="size-10" /> : <XIcon className="size-10" />}
      </motion.span>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <h1 className="text-[32px] leading-[1.3] font-semibold text-ink">
          {success ? t("successTitle") : t("failedTitle")}
        </h1>
        <p className="text-lg text-dark-300">
          {success ? t("successText", { code }) : t("failedText", { code })}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link href="/" className={buttonVariants({ variant: "outline-ink", size: "pill-lg" })}>
            {t("backHome")}
          </Link>
          <Link href="/shop" className={buttonVariants({ variant: "ink", size: "pill-lg" })}>
            {t("keepShopping")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
