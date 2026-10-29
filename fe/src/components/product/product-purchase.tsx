"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { MadeToOrderNote } from "@/components/product/made-to-order-note";
import { StarRating } from "@/components/product/star-rating";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/lib/data";
import { useCartStore } from "@/stores/cart-store";

const sections = ["description", "ingredients", "howToUse", "howToFeel"] as const;

export function ProductPurchase({
  product,
  rating,
  reviewCount,
}: {
  product: Product;
  rating: number;
  reviewCount: number;
}) {
  const t = useTranslations("ProductDetail");
  const tProduct = useTranslations("Product");
  const add = useCartStore((s) => s.add);
  const setOpen = useCartStore((s) => s.setOpen);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    add(product, quantity);
    toast.success(t("added", { count: quantity, name: product.name }), {
      action: { label: tProduct("viewCart"), onClick: () => setOpen(true) },
    });
    setQuantity(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[28px] leading-[1.3] font-semibold text-ink md:text-[32px]">
          {product.name}
        </h1>
        <p className="flex shrink-0 items-baseline gap-2 pt-1">
          <span className="text-2xl text-ink">{formatPrice(product.salePrice ?? product.price)}</span>
          {product.salePrice && (
            <span className="text-xl text-dark-50 line-through">{formatPrice(product.price)}</span>
          )}
        </p>
      </div>

      <a href="#reviews" className="mt-3 flex items-center gap-5 text-lg text-ink">
        <StarRating value={rating} />
        <span className="hover:underline">{t("reviewCount", { count: reviewCount })}</span>
      </a>

      <p className="mt-10 text-lg text-ink">{tProduct(`taglines.${product.id}`)}</p>

      <MadeToOrderNote className="mt-6" />

      <div className="mt-6 flex gap-4">
        <div
          role="group"
          aria-label={t("quantity")}
          className="flex h-16 w-[124px] shrink-0 items-center justify-between rounded-full border border-peanut px-4"
        >
          <button
            type="button"
            aria-label={t("decrease")}
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="cursor-pointer p-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MinusIcon className="size-5" />
          </button>
          <motion.span
            key={quantity}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-6 text-center text-base"
            aria-live="polite"
          >
            {quantity}
          </motion.span>
          <button
            type="button"
            aria-label={t("increase")}
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="cursor-pointer p-1"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
        <Button
          variant="ink"
          onClick={handleAdd}
          className="h-16 flex-1 rounded-full text-base font-medium tracking-[0.06em]"
        >
          {t("addToCart")}
        </Button>
      </div>

      <Accordion defaultValue={["howToFeel"]} className="mt-6">
        {sections.map((key) => (
          <AccordionItem key={key} value={key} className="border-b border-peanut not-last:border-b">
            <AccordionTrigger className="group/acc items-center rounded-none py-6 text-2xl font-semibold text-ink hover:no-underline [&>[data-slot=accordion-trigger-icon]]:hidden!">
              {t(`sections.${key}.title`)}
              <span className="relative size-6 shrink-0">
                <Image
                  src="/figma/plus.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="absolute inset-0 transition-all duration-300 group-aria-expanded/acc:rotate-90 group-aria-expanded/acc:opacity-0"
                />
                <Image
                  src="/figma/minus.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="absolute inset-0 -rotate-90 opacity-0 transition-all duration-300 group-aria-expanded/acc:rotate-0 group-aria-expanded/acc:opacity-100"
                />
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="pb-6 text-lg leading-[1.8] text-dark-300">{t(`sections.${key}.body`)}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
