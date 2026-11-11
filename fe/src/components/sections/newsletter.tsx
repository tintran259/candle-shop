// Nhận tin (Figma 2:11): ảnh 590×600 bên trái; phải — "STAY A LITTLE" lớn, tiêu đề phụ, mô tả, ô email gạch chân + "Join us ↗", dòng đồng ý
import { newsletter } from "@/content/home";
import { Container, Photo } from "@/components/ui/primitives";
import { NewsletterForm } from "@/components/sections/newsletter-form";

export function Newsletter() {
  return (
    <section aria-labelledby="newsletter-title" className="pt-4 pb-20 md:pt-2.5 md:pb-[70px]">
      <Container>
        <div className="grid gap-12 md:grid-cols-[590fr_146fr_576fr] md:gap-0">
          <Photo photo={newsletter.photo} sizes="(min-width: 768px) 41vw, 100vw" className="order-2 aspect-[590/600] md:order-none" parallax={7} />
          <div className="order-1 md:order-none md:col-start-3 md:pt-[26px]">
            <h2 id="newsletter-title" data-reveal="lines" className="display text-[clamp(56px,6vw,86px)] leading-[1.06] tracking-[0.08em] text-wine uppercase">
              {newsletter.title.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <p data-reveal="lines" className="display mt-12 text-[clamp(28px,2.4vw,34px)] text-ink md:mt-[61px]">
              {newsletter.heading}
            </p>
            <p data-reveal="fade" className="mt-6 max-w-[480px] pl-1 text-[13px] leading-[22px] text-muted">
              {newsletter.text}
            </p>
            <NewsletterForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
