// Cách đốt nến (Figma 2:9): tiêu đề 2 dòng, liên kết nhỏ, 3 bước đánh số (số đỏ rượu vang, tiêu đề có chân, mô tả) ngăn bằng đường kẻ;
// ảnh "hốc đá ngập nắng" bên phải; đường kẻ khép section. Khoảng cách theo Figma: mỗi bước cao 107px (tên 29 + 8 + mô tả 20 + 31, kẻ, 19)
import { ArrowLink, Container, Photo } from "@/components/ui/primitives";
import type { CareContent } from "@/lib/blocks";

// Chữ / ảnh từ BO › Giao diện web (lib/blocks.ts), trống thì nội dung có sẵn
export function Care({ content: care }: { content: CareContent }) {
  return (
    <section id="care" aria-labelledby="care-title" className="pt-14 md:pt-[54px]">
      <Container>
        <div className="grid gap-14 md:grid-cols-[800fr_512fr] md:gap-0">
          <div>
            <h2 id="care-title" data-reveal="lines" className="display text-[clamp(52px,5.3vw,76px)] leading-[1.05] tracking-[0.013em] text-wine">
              {care.title.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <div data-reveal="fade" className="mt-11 pl-[3px] md:mt-[38px]">
              <ArrowLink href={care.link.href} className="text-muted">
                {care.link.label}
              </ArrowLink>
            </div>

            <ol className="mt-14 max-w-[640px] md:mt-[61px]">
              {care.steps.map((s, i) => (
                <li key={i}>
                  <div data-reveal="fade" className="grid grid-cols-[50px_1fr] pb-[31px] pl-0.5">
                    <span className="pt-[3px] text-[10px] leading-3 text-wine tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="display text-2xl leading-[29px] text-ink">{s.title}</h3>
                      <p className="mt-2 text-[12px] leading-5 text-muted">{s.text}</p>
                    </div>
                  </div>
                  <div data-reveal="line" className="mb-[19px] h-[0.7px] bg-rule" />
                </li>
              ))}
            </ol>
          </div>
          <Photo photo={care.photo} sizes="(min-width: 768px) 36vw, 100vw" className="aspect-[512/506] md:mt-[120px]" parallax={7} />
        </div>
        <div data-reveal="line" className="mt-16 h-[0.7px] bg-rule md:mt-[59px]" />
      </Container>
    </section>
  );
}
