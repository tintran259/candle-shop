// Trang 404 (đường dẫn sai, mẫu nến không còn bán): cùng khung, thanh điều hướng như các trang khác
import { SiteShell } from "@/components/site-shell";
import { ArrowLink, Container } from "@/components/ui/primitives";
import { productDetail } from "@/content/home";

export default function NotFound() {
  const t = productDetail.notFound;
  return (
    <SiteShell>
      <section className="pt-[160px] pb-32 md:pt-[220px] md:pb-40">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">404</p>
            <h1 className="display mt-4 text-[clamp(40px,5vw,72px)] text-wine">{t.title}</h1>
            <p className="mx-auto mt-6 max-w-md text-[14px] leading-6 text-muted">{t.text}</p>
            <div className="mt-10">
              <ArrowLink href="/products" className="text-wine uppercase">
                {t.back}
              </ArrowLink>
            </div>
          </div>
        </Container>
      </section>
    </SiteShell>
  );
}
