import { ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/home/product-card";
import { Reveal } from "@/components/motion/reveal";
import { MissionSection } from "@/components/product/mission-section";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductReviews } from "@/components/product/product-reviews";
import { Link } from "@/i18n/navigation";
import {
  getProductBySlug,
  getReviews,
  products,
  relatedProducts,
} from "@/lib/data";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const t = await getTranslations({ locale, namespace: "Product" });
  return {
    title: `${product.name} — 2510 Scented Candle`,
    description: t(`taglines.${product.id}`),
    openGraph: { images: [product.image] },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("ProductDetail");
  const reviews = getReviews(product.id);
  const rating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  // Lặp ảnh đại diện cho đủ 4 ô nếu sản phẩm chưa có gallery riêng
  const gallery = product.gallery ?? Array(4).fill(product.image);

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 pt-8 md:px-10 lg:pt-10 xl:px-20">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-4 text-lg text-ink">
            <li>
              <Link href="/" className="hover:text-peanut">
                {t("breadcrumbHome")}
              </Link>
            </li>
            <ChevronRightIcon className="size-5" aria-hidden />
            <li>
              <Link href="/shop" className="hover:text-peanut">
                {t("breadcrumbShop")}
              </Link>
            </li>
            <ChevronRightIcon className="size-5 text-dark-300" aria-hidden />
            <li aria-current="page" className="truncate text-dark-300">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-10 grid gap-10 pb-20 lg:mt-14 lg:grid-cols-[632px_1fr] lg:gap-20">
          <ProductGallery name={product.name} images={gallery} />
          <ProductPurchase product={product} rating={rating} reviewCount={reviews.length} />
        </div>
      </div>

      <MissionSection />

      <ProductReviews reviews={reviews} />

      <section className="mx-auto max-w-[1440px] px-4 py-20 md:px-10 xl:px-20">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-[0.08em] text-ink">{t("youMayAlsoLike")}</h2>
        </Reveal>
        <ul className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-4">
          {relatedProducts(product).map((p, i) => (
            <li key={p.id}>
              <Reveal delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
