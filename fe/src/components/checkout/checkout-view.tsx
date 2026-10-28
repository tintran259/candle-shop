"use client";

import { ChevronRightIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { ContactCard } from "@/components/checkout/contact-card";
import { OrderSummary } from "@/components/checkout/order-summary";
import { buttonVariants } from "@/components/ui/button";
import { useCartHydrated } from "@/hooks/use-cart-hydrated";
import { Link, useRouter } from "@/i18n/navigation";
import {
  calcTotals,
  createOrder,
  FREE_SHIPPING_THRESHOLD,
  shippingMethods,
} from "@/lib/checkout";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import { selectCount, unitPrice, useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";

export function CheckoutView() {
  const t = useTranslations("Checkout");
  const tCart = useTranslations("Cart");
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useCartHydrated();
  const { items, updateQuantity, remove } = useCartStore();
  const count = useCartStore(selectCount);
  const { contact, shipping, setShipping, payment, discountCode } = useCheckoutStore();
  const [submitting, setSubmitting] = useState(false);
  const [needContact, setNeedContact] = useState(false);

  const totals = calcTotals(items, shipping, discountCode);

  const handleSubmit = async () => {
    if (!contact) {
      setNeedContact(true);
      toast.error(t("errors.contactRequired"));
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        contact,
        shipping,
        payment,
        discountCode,
        locale,
      });
      // VNPay / MoMo: chuyển sang cổng thanh toán; COD: tới trang kết quả
      if (order.payUrl) {
        window.location.href = order.payUrl;
        return;
      }
      router.push({ pathname: "/checkout/result", query: { status: "success", code: order.orderCode } });
    } catch {
      toast.error(t("orderFailed"));
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <div className="mx-auto min-h-[60vh] max-w-[1440px]" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1440px] flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <h1 className="text-[32px] font-semibold text-ink">{t("emptyTitle")}</h1>
        <p className="text-lg text-dark-300">{t("emptyText")}</p>
        <Link href="/shop" className={cn(buttonVariants({ variant: "ink", size: "pill-lg" }), "mt-4")}>
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-20 md:px-10 lg:pt-10 xl:px-20">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-4 text-lg text-ink">
          <li>
            <Link href="/shop" className="hover:text-peanut">
              {t("breadcrumbCart")}
            </Link>
          </li>
          <ChevronRightIcon className="size-5 text-dark-300" aria-hidden />
          <li aria-current="page" className="text-dark-300">
            {t("title")}
          </li>
        </ol>
      </nav>

      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[1fr_516px] lg:gap-20">
        <div className="flex flex-col gap-14">
          {/* Giỏ hàng */}
          <section>
            <h1 className="flex items-center gap-3 text-2xl font-semibold text-ink">
              {t("cart")}
              <motion.span
                key={count}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="flex size-8 items-center justify-center rounded-full bg-ink text-base text-white"
              >
                {count}
              </motion.span>
            </h1>
            <ul className="mt-8 flex flex-col gap-6">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    exit={{ opacity: 0, x: -30 }}
                    className="flex items-center gap-8"
                  >
                    <div className="relative size-[120px] shrink-0 overflow-hidden rounded-xl">
                      <Image src={item.image} alt={item.name} fill sizes="120px" className="object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-2xl font-semibold text-ink md:text-[28px]">{item.name}</p>
                        <button
                          type="button"
                          aria-label={t("remove", { name: item.name })}
                          onClick={() => remove(item.id)}
                          className="mt-2 cursor-pointer text-dark-300 transition-colors hover:text-rose"
                        >
                          <Trash2Icon className="size-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex h-10 w-[115px] items-center justify-between rounded-full border border-peanut px-3">
                          <button
                            type="button"
                            aria-label={tCart("decrease")}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="cursor-pointer"
                          >
                            <MinusIcon className="size-4" />
                          </button>
                          <span className="text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={tCart("increase")}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="cursor-pointer"
                          >
                            <PlusIcon className="size-4" />
                          </button>
                        </div>
                        <span className="text-2xl text-ink">{formatPrice(unitPrice(item) * item.quantity)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>

          <div id="contact" className="scroll-mt-40">
            <ContactCard highlight={needContact} />
          </div>

          {/* Giao hàng */}
          <section>
            <h2 className="text-2xl font-semibold text-ink">{t("shippingMethod")}</h2>
            <div role="radiogroup" className="mt-6 overflow-hidden rounded-2xl border border-brand-100 bg-[#fdfbf7]">
              {shippingMethods.map((m) => {
                const active = shipping === m.id;
                const fee = totals.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : m.fee;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setShipping(m.id)}
                    className="flex w-full cursor-pointer items-center gap-4 border-b border-brand-100 px-6 py-5 text-left last:border-b-0"
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                        active ? "border-peanut bg-peanut text-white" : "border-peanut",
                      )}
                    >
                      {active && (
                        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-xl font-semibold text-ink">{t(`shipping.${m.id}`)}</span>
                      <span className="text-sm text-dark-300">{t("arrive", { days: m.days })}</span>
                    </span>
                    <span className="text-lg font-semibold text-ink">
                      {fee === 0 ? t("free") : `$${fee.toFixed(2)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[151px] lg:self-start">
          <OrderSummary
            totals={totals}
            submitting={submitting}
            disabled={items.length === 0}
            onSubmit={handleSubmit}
          />
        </aside>
      </div>
    </div>
  );
}
