// Bộ sưu tập (Figma 2:7): "ATELIER" lớn trái, câu dẫn + ghi chú canh phải; nhãn bộ sưu tập; 3 thẻ nến (ảnh vuông-ngang 416×420,
// nhóm hương, tên + giá, nốt hương, dung tích); liên kết "Explore all candles ↗" góc phải dưới
import { collection } from "@/content/home";
import { ArrowLink, Container, Photo } from "@/components/ui/primitives";

export function Collection() {
  return (
    <section id="collection" aria-labelledby="collection-title" className="pt-10 pb-20 md:pt-12 md:pb-[60px]">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <h2 id="collection-title" data-reveal="chars" className="display text-[clamp(56px,6.25vw,90px)] leading-none tracking-[0.1em] text-wine uppercase">
            {collection.title}
          </h2>
          <div className="md:pt-[52px] md:text-right">
            <p data-reveal="lines" className="display text-[clamp(24px,2.2vw,32px)] leading-tight text-ink">
              {collection.heading}
            </p>
            <p data-reveal="fade" className="mt-4 text-[11px] tracking-[0.11em] text-muted uppercase">
              {collection.note}
            </p>
          </div>
        </div>

        <p data-reveal="fade" className="eyebrow mt-12 md:mt-[37px]">
          {collection.eyebrow}
        </p>

        <ul className="mt-10 grid gap-12 sm:grid-cols-2 md:mt-10 md:grid-cols-3 md:gap-8">
          {collection.products.map((p, i) => (
            <li key={p.name} className="group">
              <a href={collection.more.href} className="block">
                <Photo photo={p.photo} sizes="(min-width: 768px) 30vw, (min-width: 640px) 50vw, 100vw" className="aspect-[416/420]" parallax={i === 1 ? 6 : 4} zoom />
                <div data-reveal="fade" className="pt-[26px]">
                  <p className="text-[9px] tracking-[0.11em] text-muted uppercase">{p.category}</p>
                  <div className="mt-2.5 flex items-baseline justify-between gap-4">
                    <h3 className="display text-[27px] tracking-[0.02em] text-wine">
                      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                        {p.name}
                      </span>
                    </h3>
                    <span className="text-[13px] text-muted">{p.price}</span>
                  </div>
                  <p className="mt-2 text-[12px] text-muted">{p.notes}</p>
                  <p className="mt-4 text-[10px] text-muted">{p.details}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <div data-reveal="fade" className="mt-10 flex justify-end md:mt-1.5">
          <ArrowLink href={collection.more.href} className="text-wine uppercase">
            {collection.more.label}
          </ArrowLink>
        </div>
      </Container>
    </section>
  );
}
