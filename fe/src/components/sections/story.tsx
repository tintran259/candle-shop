// Câu chuyện (Figma 2:8): trái — nhãn, "CRAFTING ATMOSPHERE", ảnh tĩnh vật 760×510; phải — "OUR ESSENCE" lớn,
// tiêu đề phụ 2 dòng, 2 đoạn văn, liên kết; đường kẻ khép section
import { story } from "@/content/home";
import { ArrowLink, Container, Photo } from "@/components/ui/primitives";

export function Story() {
  return (
    <section id="story" aria-labelledby="story-title" className="pt-16 md:pt-[55px]">
      <Container>
        <div className="grid gap-12 md:grid-cols-[760fr_552fr] md:gap-0">
          <div className="md:pt-[30px]">
            <p data-reveal="fade" className="eyebrow">
              {story.eyebrow}
            </p>
            <p data-reveal="lines" className="display mt-5 text-[clamp(24px,2.15vw,31px)] tracking-[0.065em] text-ink uppercase">
              {story.kicker}
            </p>
            <Photo photo={story.photo} sizes="(min-width: 768px) 53vw, 100vw" className="mt-11 aspect-[760/510]" />
          </div>

          <div className="md:pl-[92px]">
            <h2 id="story-title" data-reveal="lines" className="display text-[clamp(56px,5.7vw,82px)] leading-[1.07] tracking-[0.085em] text-wine uppercase">
              {story.title.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <p data-reveal="lines" className="display mt-10 text-[clamp(30px,2.65vw,38px)] leading-[1.1] text-ink md:mt-[49px]">
              {story.heading.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </p>
            <div className="mt-9 max-w-[420px] space-y-6 text-[14px] leading-6 text-muted">
              {story.body.map((b) => (
                <p key={b} data-reveal="fade">
                  {b}
                </p>
              ))}
            </div>
            <div data-reveal="fade" className="mt-12 md:mt-[90px]">
              <ArrowLink href={story.cta.href} className="text-wine">
                {story.cta.label}
              </ArrowLink>
            </div>
          </div>
        </div>
        <div data-reveal="line" className="mt-16 h-[0.7px] bg-rule md:mt-[88px]" />
      </Container>
    </section>
  );
}
