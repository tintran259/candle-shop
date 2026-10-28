"use client";

import { ChevronLeftIcon, ChevronRightIcon, TicketPercentIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findDiscount, type calcTotals } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore, type PaymentMethod } from "@/stores/checkout-store";

const payments: PaymentMethod[] = ["vnpay", "momo", "cod"];

const usd = (n: number) => `$${n.toFixed(2)}`;

export function OrderSummary({
  totals,
  submitting,
  disabled,
  onSubmit,
}: {
  totals: ReturnType<typeof calcTotals>;
  submitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
}) {
  const t = useTranslations("Checkout");
  const setCartOpen = useCartStore((s) => s.setOpen);
  const { payment, setPayment } = useCheckoutStore();

  const rows = [
    { label: t("subtotal"), value: usd(totals.subtotal) },
    ...(totals.discount > 0 ? [{ label: t("discountLine"), value: `-${usd(totals.discount)}` }] : []),
    { label: t("shippingFee"), value: totals.shippingFee === 0 ? t("free") : usd(totals.shippingFee) },
    { label: t("taxes"), value: usd(totals.taxes) },
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-brand-100 bg-[#fdfbf7] p-6">
      <DiscountCode />

      <div className="mt-10 border-b border-brand-100 pb-10">
        <h2 className="text-2xl font-semibold text-ink">{t("paymentMethod")}</h2>
        <div role="radiogroup" className="mt-6 grid gap-3">
          {payments.map((p) => {
            const active = payment === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPayment(p)}
                className={cn(
                  "relative flex cursor-pointer items-center gap-4 rounded-full border px-6 py-3 text-left transition-colors",
                  active ? "border-ink bg-ink text-white" : "border-brand-200 bg-white text-ink hover:border-peanut",
                )}
              >
                <PaymentMark method={p} active={active} />
                <span className="flex flex-col">
                  <span className="text-base font-semibold">{t(`payments.${p}`)}</span>
                  <span className={cn("text-xs", active ? "text-brand-50" : "text-dark-300")}>
                    {t(`paymentHints.${p}`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-semibold text-ink">{t("summary")}</h2>
      <dl className="mt-6 flex flex-col gap-6 border-b border-brand-100 pb-6">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-lg">
            <dt className="text-dark-300">{row.label}</dt>
            <dd className="font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between border-b border-brand-100 py-8">
        <span className="text-2xl text-dark-300">{t("total")}</span>
        <motion.span
          key={totals.total}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-bold text-ink"
        >
          {usd(totals.total)}
        </motion.span>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex cursor-pointer items-center gap-3 text-lg text-ink hover:text-peanut"
        >
          <ChevronLeftIcon className="size-5" />
          {t("returnCart")}
        </button>
        <Button
          variant="ink"
          size="pill-lg"
          disabled={disabled || submitting}
          onClick={onSubmit}
          className="min-w-[200px] text-base"
        >
          {submitting ? t("processing") : t("checkout")}
        </Button>
      </div>
    </div>
  );
}

function PaymentMark({ method, active }: { method: PaymentMethod; active: boolean }) {
  const styles: Record<PaymentMethod, string> = {
    vnpay: "bg-[#005baa] text-white",
    momo: "bg-[#a50064] text-white",
    cod: active ? "bg-white text-ink" : "bg-ink text-white",
  };
  const label: Record<PaymentMethod, string> = { vnpay: "VN", momo: "Mo", cod: "$" };
  return (
    <span
      aria-hidden
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", styles[method])}
    >
      {label[method]}
    </span>
  );
}

function DiscountCode() {
  const t = useTranslations("Checkout");
  const { discountCode, setDiscountCode } = useCheckoutStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const apply = () => {
    const code = value.trim().toUpperCase();
    if (!findDiscount(code)) {
      setError(true);
      return;
    }
    setDiscountCode(code);
    setOpen(false);
    setValue("");
    toast.success(t("discount.applied", { code }));
  };

  if (discountCode) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-peanut bg-brand-50 px-6 py-4">
        <span className="flex items-center gap-3 text-lg text-ink">
          <TicketPercentIcon className="size-6 text-peanut" />
          {discountCode}
        </span>
        <button
          type="button"
          aria-label={t("discount.remove")}
          onClick={() => setDiscountCode(null)}
          className="cursor-pointer text-dark-300 hover:text-rose"
        >
          <XIcon className="size-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-100 bg-[#fbf3ea]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-lg text-peanut"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-peanut text-white">
            <TicketPercentIcon className="size-4" />
          </span>
          {t("discount.apply")}
        </span>
        <ChevronRightIcon className={cn("size-5 transition-transform", open && "rotate-90")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 px-6 pb-4">
              <Input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(false);
                }}
                placeholder={t("discount.placeholder")}
                aria-invalid={error}
                className="h-11 rounded-full bg-white px-4 text-base uppercase"
              />
              <Button type="submit" variant="ink" size="pill" disabled={!value.trim()}>
                {t("discount.button")}
              </Button>
            </div>
            {error && <p className="px-6 pb-4 text-sm text-rose">{t("discount.invalid")}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
