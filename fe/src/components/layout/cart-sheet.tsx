"use client";

import { AnimatePresence, motion } from "motion/react";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CartThumb } from "@/components/customizer/cart-thumb";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/data";
import { pick } from "@/lib/shop-config";
import { cn } from "@/lib/utils";
import {
  selectSubtotal,
  unitPrice,
  useCartStore,
} from "@/stores/cart-store";

const FREE_SHIPPING = 100;

export function CartSheet() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { items, isOpen, setOpen, updateQuantity, remove } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const remaining = Math.max(FREE_SHIPPING - subtotal, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full gap-0 bg-cream p-0 sm:max-w-md">
        <SheetHeader className="border-b border-brand-100 p-6">
          <SheetTitle className="text-2xl font-semibold">{t("title")}</SheetTitle>
          <p className="text-sm text-dark-300">
            {remaining > 0
              ? t("freeShippingRemaining", { amount: formatPrice(remaining) })
              : t("freeShippingUnlocked")}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-brand-100">
            <motion.div
              className="h-full bg-peanut"
              animate={{ width: `${Math.min(subtotal / FREE_SHIPPING, 1) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6" data-lenis-prevent>
          {items.length === 0 ? (
            <p className="py-16 text-center text-dark-300">{t("empty")}</p>
          ) : (
            <ul className="flex flex-col gap-5">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="flex gap-4"
                  >
                    <CartThumb item={item} sizes="80px" className="size-20" />
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div className="flex justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <p className="text-lg font-semibold">{item.name}</p>
                          {item.craft && (
                            <p className="line-clamp-2 text-xs text-dark-300">{pick(item.craft.details, locale)}</p>
                          )}
                        </div>
                        <p className="text-lg">{formatPrice(unitPrice(item) * item.quantity)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-brand-200">
                          <QtyButton label={t("decrease")} onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <MinusIcon className="size-4" />
                          </QtyButton>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <QtyButton label={t("increase")} onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <PlusIcon className="size-4" />
                          </QtyButton>
                        </div>
                        <button
                          type="button"
                          aria-label={t("remove", { name: item.name })}
                          onClick={() => remove(item.id)}
                          className="cursor-pointer text-dark-300 transition-colors hover:text-rose"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <SheetFooter className="border-t border-brand-100 p-6">
          <p className="mb-3 text-sm text-dark-300">{t("madeToOrder")}</p>
          <div className="flex justify-between text-xl">
            <span>{t("subtotal")}</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={() => setOpen(false)}
            aria-disabled={items.length === 0}
            className={cn(
              buttonVariants({ variant: "ink", size: "pill-lg" }),
              "mt-4 w-full",
              items.length === 0 && "pointer-events-none opacity-50",
            )}
          >
            {t("checkout")}
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function QtyButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center transition-colors hover:text-peanut"
    >
      {children}
    </button>
  );
}
