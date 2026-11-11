// Trang Sản phẩm: danh sách mẫu nến Đang bán từ BE (GET /api/shop/products), lọc theo danh mục, sắp xếp.
// Dựng ở máy chủ, làm mới sau mỗi 60 giây (ISR); BE lỗi / đang khởi động thì hiện thông báo thử lại
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { Container } from "@/components/ui/primitives";
import { ProductBrowser } from "@/components/products/product-browser";
import { productsPage } from "@/content/home";
import { getShopContact, getShopProducts, zaloUrl } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Sản phẩm — 2510 Candle",
  description: "Các mẫu nến thơm đổ tay theo đơn của 2510 Candle — chọn theo mùi hương, danh mục và giá.",
};

// ?q=: hiện kết quả tìm kiếm (từ hộp tìm kiếm); ?category=: mở sẵn một danh mục (breadcrumb trang chi tiết). Dữ liệu vẫn lưu đệm 60 giây theo từng lần gọi BE
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> }) {
  const params = await searchParams;
  const q = [params.q].flat()[0]?.trim() ?? "";
  const category = [params.category].flat()[0];
  const [data, contact] = await Promise.all([getShopProducts(), getShopContact()]);
  return (
    <SiteShell>
      <section aria-labelledby="products-title" className="pt-[132px] pb-20 md:pt-[172px] md:pb-28">
        <Container>
          <p data-reveal="fade" className="eyebrow">
            {productsPage.eyebrow}
          </p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 id="products-title" data-reveal="chars" className="display text-[clamp(52px,6.25vw,90px)] leading-none tracking-[0.1em] text-wine uppercase">
              {productsPage.title}
            </h1>
            <p data-reveal="fade" className="max-w-[420px] text-[14px] leading-6 text-muted md:pb-2 md:text-right">
              {productsPage.text}
            </p>
          </div>
          <ProductBrowser key={`${q}|${category}`} query={q} initialCategory={category} data={data} contactUrl={zaloUrl(contact?.phone)} />
        </Container>
      </section>
    </SiteShell>
  );
}
