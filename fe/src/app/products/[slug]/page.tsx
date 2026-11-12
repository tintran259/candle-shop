// Trang chi tiết sản phẩm (/products/<slug>): breadcrumb, bộ ảnh, tên, giá, mô tả, thông số, nút Liên hệ đặt nến (Zalo), mẹo đốt nến,
// nhãn concept (dịp lễ), gợi ý 4 mẫu (chung concept, rồi cùng danh mục). Dữ liệu từ GET /api/shop/products (lưu đệm 60 giây); mẫu không còn bán / sai slug → trang 404
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { ArrowLink, Container } from "@/components/ui/primitives";
import { ContactButton } from "@/components/products/contact-button";
import { ProductCard } from "@/components/products/product-card";
import { ProductGallery } from "@/components/products/product-gallery";
import { care, productDetail as t, productsPage } from "@/content/home";
import { aromaLabels, formatDay, formatPrice, withoutDataImages, saleEndsOn, getShopContact, getShopProducts, productUrl, sizeLabels, suggestProducts, zaloUrl } from "@/lib/shop";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const data = await getShopProducts();
  const product = data?.products.find((p) => p.slug === decodeURIComponent(slug));
  return { data, product };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await load((await params).slug);
  if (!product) return { title: `${t.notFound.title} — 2510 Candle` };
  const description = (product.description ?? product.scent ?? "").replace(/\s+/g, " ").slice(0, 160);
  const image = product.images.find((s) => s.startsWith("https://"));
  const url = productUrl(product);
  return { title: `${product.name} — 2510 Candle`, description, alternates: { canonical: url }, openGraph: { title: product.name, description, url, images: image ? [image] : undefined } };
}

export default async function ProductDetailPage({ params }: Props) {
  const [{ data, product: p }, contact] = await Promise.all([load((await params).slug), getShopContact()]);
  if (!data || !p) notFound();

  const category = data.categories.find((c) => c.id === p.categoryId);
  const concepts = data.concepts.filter((c) => p.conceptIds.includes(c.id));
  const until = saleEndsOn(p, data.concepts);
  const names = new Map(data.categories.map((c) => [c.id, c.name]));
  const contactUrl = zaloUrl(contact?.phone);
  const suggestions = suggestProducts(data.products, p);
  const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const specs = [
    [t.specs.scent, p.scent],
    [t.specs.aroma, aromaLabels[p.aromaLevel]],
    [t.specs.size, sizeLabels[p.size]],
    [t.specs.wax, p.waxType],
    [t.specs.burn, p.burnTime && t.burn(p.burnTime)],
  ].filter((r): r is [string, string] => !!r[1]);
  // Dữ liệu có cấu trúc cho máy tìm kiếm (Google hiện giá, ảnh)
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? p.scent,
    image: p.images.filter((s) => s.startsWith("https://")),
    category: category?.name,
    offers: { "@type": "Offer", price: p.salePrice ?? p.price, priceCurrency: "VND", availability: "https://schema.org/MadeToOrder" },
  };

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <article aria-labelledby="product-title" className="pt-[116px] md:pt-[148px]">
        <Container>
          <nav aria-label="Breadcrumb" data-reveal="fade">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] tracking-[0.12em] text-muted uppercase">
              {[{ label: t.home, href: "/" }, { label: t.products, href: "/products" }, ...(category ? [{ label: category.name, href: `/products?category=${category.id}` }] : [])].map((c) => (
                <li key={c.href} className="flex items-center gap-2">
                  <Link href={c.href} className="py-2 transition-colors hover:text-wine">
                    {c.label}
                  </Link>
                  <span aria-hidden>/</span>
                </li>
              ))}
              <li aria-current="page" className="py-2 text-ink">
                {p.name}
              </li>
            </ol>
          </nav>

          <div className="mt-6 grid gap-10 md:mt-8 md:grid-cols-[1.1fr_1fr] md:gap-14 xl:gap-20">
            {/* Không gắn data-reveal: ảnh chính ở đầu trang là phần tử LCP, không ẩn chờ JS */}
            <div>
              <ProductGallery
                images={p.images}
                name={p.name}
                badges={
                  <>
                    {p.isNew && <span className="bg-cream px-2.5 py-1 text-[10px] tracking-[0.12em] text-wine uppercase">{productsPage.badgeNew}</span>}
                    {off > 0 && <span className="bg-wine px-2.5 py-1 text-[10px] tracking-[0.08em] text-cream">−{off}%</span>}
                  </>
                }
              />
            </div>

            <div className="md:sticky md:top-28 md:self-start">
              {category && (
                <p data-reveal="fade" className="eyebrow">
                  {category.name}
                </p>
              )}
              <h1 id="product-title" data-reveal="lines" className="display mt-3 text-[clamp(40px,4.4vw,64px)] leading-[1.05] text-wine">
                {p.name}
              </h1>
              <p data-reveal="fade" className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
                <span className={p.salePrice ? "text-[22px] text-wine" : "text-[22px] text-ink"}>{formatPrice(p.salePrice ?? p.price)}</span>
                {p.salePrice && <s className="text-[14px] text-muted">{formatPrice(p.price)}</s>}
              </p>
              {concepts.length > 0 && (
                <ul data-reveal="fade" aria-label={t.concepts} className="mt-5 flex flex-wrap gap-2">
                  {concepts.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/products?concept=${c.id}`}
                        className="inline-flex min-h-8 items-center border border-rule px-3 text-[10px] tracking-[0.12em] text-ink uppercase transition-colors hover:border-wine hover:text-wine"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {p.description && (
                <div data-reveal="fade" className="mt-8 space-y-4 text-[14px] leading-7 text-muted">
                  {p.description.split(/\n\s*\n/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}

              <dl data-reveal="fade" className="mt-8 border-t border-rule">
                {specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[130px_1fr] gap-4 border-b border-rule py-3.5">
                    <dt className="text-[10px] tracking-[0.14em] text-muted uppercase">{k}</dt>
                    <dd className="text-[13px] text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <div data-reveal="fade" className="mt-8">
                {until && <p className="mb-2 text-[13px] text-wine">{t.saleUntil(until.names, formatDay(until.date))}</p>}
                <p className="mb-4 text-[12px] text-muted">{t.madeToOrder}</p>
                {contactUrl ? <ContactButton href={contactUrl} product={p.name} variant="solid" /> : <p className="text-[13px] text-ink">{t.noContact}</p>}
                <div className="mt-6">
                  <ArrowLink href="/products" className="text-wine uppercase">
                    {t.back}
                  </ArrowLink>
                </div>
              </div>

              <section data-reveal="fade" aria-labelledby="care-tips" className="mt-12 bg-rule/15 px-6 py-6">
                <h2 id="care-tips" className="eyebrow">
                  {t.care}
                </h2>
                <ol className="mt-4 space-y-4">
                  {care.steps.map((s, i) => (
                    <li key={s.title} className="grid grid-cols-[28px_1fr]">
                      <span className="pt-1 text-[10px] text-wine tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <p className="text-[12px] leading-5 text-muted">
                        <span className="display text-[17px] text-ink">{s.title}.</span> {s.text}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </Container>
      </article>

      {suggestions.length > 0 && (
        <section aria-labelledby="suggest-title" className="mt-24 pb-24 md:mt-32 md:pb-28">
          <Container>
            <div className="flex flex-col gap-4 border-t border-rule pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
              <div>
                <p data-reveal="fade" className="eyebrow">
                  {t.suggest.eyebrow}
                </p>
                <h2 id="suggest-title" data-reveal="lines" className="display mt-3 text-[clamp(32px,3.4vw,48px)] text-ink">
                  {t.suggest.title}
                </h2>
              </div>
              <div data-reveal="fade">
                <ArrowLink href={category ? `/products?category=${category.id}` : "/products"} className="text-wine uppercase">
                  {t.suggest.more}
                </ArrowLink>
              </div>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-12 md:grid-cols-4 md:gap-x-6">
              {suggestions.map((s) => (
                <li key={s.id} data-reveal="fade" className="flex">
                  <ProductCard product={withoutDataImages(s)} category={names.get(s.categoryId)} contactUrl={contactUrl} heading="h3" />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </SiteShell>
  );
}
