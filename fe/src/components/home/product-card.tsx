"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatPrice, type Product } from "@/lib/data";
import { useCartStore } from "@/stores/cart-store";

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("Product");
  const add = useCartStore((s) => s.add);
  const setOpen = useCartStore((s) => s.setOpen);
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  const handleAdd = () => {
    add(product);
    toast.success(t("added", { name: product.name }), {
      action: { label: t("viewCart"), onClick: () => setOpen(true) },
    });
  };

  return (
    <article className="group flex flex-col gap-6">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 290px, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {discount > 0 && (
          <span className="absolute top-4 right-4 flex size-12 items-center justify-center rounded-full bg-rose text-lg leading-none text-white">
            -{discount}%
          </span>
        )}
        {product.isNew && (
          <span className="absolute top-4 right-4 flex h-[42px] w-[65px] items-center justify-center bg-[url(/figma/badge-new.svg)] bg-no-repeat text-sm text-white">
            {t("new")}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 leading-[1.6]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-ink">{product.name}</h3>
            <p className="flex items-baseline gap-1">
              <span className="text-xl text-ink">
                {formatPrice(product.salePrice ?? product.price)}
              </span>
              {product.salePrice && (
                <span className="text-base text-dark-50 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </p>
          </div>
          <p className="text-base text-ink">{t(`taglines.${product.id}`)}</p>
        </div>

        <motion.div whileTap={{ scale: 0.96 }}>
          <Button
            variant="outline-peanut"
            onClick={handleAdd}
            className="group/add h-auto w-full gap-2 rounded-[30px] px-4 py-3 text-xl font-medium"
          >
            {t("addToCart")}
            <Image
              src="/figma/circle-plus.svg"
              alt=""
              width={24}
              height={24}
              className="size-6! transition-transform duration-300 group-hover/add:rotate-90 group-hover/add:invert"
            />
          </Button>
        </motion.div>
      </div>
    </article>
  );
}
