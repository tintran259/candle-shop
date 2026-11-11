// Chân trang (Figma 2:12): tên thương hiệu, khẩu hiệu, 3 cột liên kết (trái); ảnh "nắng vàng trên đá travertine" (phải);
// đường kẻ; bản quyền + liên kết pháp lý
import { brand, footer } from "@/content/home";
import { Container, Logo, Photo } from "@/components/ui/primitives";

const link = "relative inline-block py-1.5 text-[11px] leading-[14px] text-muted transition-colors duration-300 hover:text-wine";

export function SiteFooter() {
  return (
    <footer className="pt-6 pb-6">
      <Container>
        <div className="grid gap-12 md:grid-cols-[800fr_512fr] md:gap-0">
          <div className="md:pt-[23px]">
            <div data-reveal="clip" className="text-copper">
              <Logo label="2510 Candle" className="w-[clamp(200px,20vw,290px)]" />
            </div>
            <p data-reveal="fade" className="mt-5 pl-0.5 text-[12px] text-muted">
              {footer.tagline}
            </p>
            <div className="mt-14 grid grid-cols-2 gap-y-10 sm:grid-cols-3 md:mt-[63px] md:max-w-[741px]">
              {footer.columns.map((c) => (
                <nav key={c.title} aria-label={c.title} data-reveal="fade">
                  <p className="text-[9px] tracking-[0.13em] text-muted uppercase">{c.title}</p>
                  <ul className="mt-5">
                    {c.links.map((l) => (
                      <li key={l.label}>
                        <a href={l.href} className={link}>
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
          <Photo photo={footer.photo} sizes="(min-width: 768px) 36vw, 100vw" className="aspect-[512/338]" parallax={5} />
        </div>

        <div data-reveal="line" className="mt-14 h-[0.7px] bg-rule md:mt-[26px]" />
        <div className="flex flex-col gap-3 pt-6 text-[10px] text-muted sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand}
          </p>
          <ul className="flex gap-7">
            {footer.legal.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="-my-2.5 inline-block py-2.5 transition-colors hover:text-wine">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
