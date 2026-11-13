// Bộ sưu tập (Figma 2:7): "ATELIER" lớn trái, câu dẫn + ghi chú canh phải; nhãn bộ sưu tập; thẻ nến; liên kết "Xem tất cả nến ↗" góc phải dưới.
// 3 thẻ: lưới như design. Hơn 3 (chủ shop chọn ở BO › Giao diện web, tối đa 12): băng chuyền tự cuộn vô hạn — nhân đôi danh sách rồi trượt
// nửa chiều dài (animate-marquee, globals.css), rê chuột / focus thì dừng; bật giảm chuyển động thì thành hàng vuốt ngang, không tự chạy
import type { CSSProperties } from "react";
import { collection } from "@/content/home";
import { ArrowLink, Container } from "@/components/ui/primitives";
import { CollectionCard } from "@/components/sections/collection-card";
import type { CollectionText, FeaturedCard } from "@/lib/home";

// Giây cho mỗi thẻ đi qua — càng nhiều thẻ vòng càng dài, tốc độ giữ nguyên
const SECONDS_PER_CARD = 7;

function Grid({ cards }: { cards: FeaturedCard[] }) {
  return (
    <ul className="mt-10 grid gap-12 sm:grid-cols-2 md:mt-[37px] md:grid-cols-3 md:gap-8">
      {cards.map((p, i) => (
        <li key={p.key}>
          <CollectionCard card={p} parallax={i === 1 ? 6 : 4} sizes="(min-width: 768px) 30vw, (min-width: 640px) 50vw, 100vw" />
        </li>
      ))}
    </ul>
  );
}

function Marquee({ cards }: { cards: FeaturedCard[] }) {
  const style = { "--marquee-duration": `${cards.length * SECONDS_PER_CARD}s` } as CSSProperties;
  return (
    // Nằm ngoài Container: tràn hết bề ngang màn hình (kể cả màn rộng hơn 1440px) để thẻ trôi vào / ra đúng mép màn hình
    <div
      aria-label="Các mẫu nến, tự cuộn — rê chuột để dừng"
      role="region"
      className="group/marquee mt-10 overflow-hidden motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto"
    >
      <ul style={style} className="flex w-max animate-marquee group-focus-within/marquee:[animation-play-state:paused] group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none">
        {[...cards, ...cards].map((p, i) => {
          const copy = i >= cards.length;
          return (
            // Bản sao (nửa sau) chỉ để nối vòng: ẩn với trình đọc màn hình, không nhận focus; giảm chuyển động thì bỏ hẳn
            <li
              key={`${p.key}-${copy ? "b" : "a"}`}
              aria-hidden={copy || undefined}
              inert={copy}
              className={`w-[78vw] shrink-0 pl-5 sm:w-[44vw] md:w-[31vw] md:pl-8 xl:w-[min(29vw,448px)] motion-reduce:snap-start ${copy ? "motion-reduce:hidden" : ""}`}
            >
              <CollectionCard card={p} parallax={4} sizes="(min-width: 768px) 31vw, (min-width: 640px) 44vw, 78vw" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Collection({ cards, text }: { cards: FeaturedCard[]; text: CollectionText }) {
  const marquee = cards.length > 3;
  return (
    <section id="collection" aria-labelledby="collection-title" className="pt-10 pb-20 md:pt-12 md:pb-[60px]">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <h2 id="collection-title" data-reveal="chars" className="display text-[clamp(56px,6.25vw,90px)] leading-none tracking-[0.1em] text-wine uppercase">
            {text.title}
          </h2>
          <div className="md:pt-[52px] md:text-right">
            <p data-reveal="lines" className="display text-[clamp(24px,2.2vw,32px)] leading-tight text-ink">
              {text.heading}
            </p>
            <p data-reveal="fade" className="mt-4 text-[11px] tracking-[0.11em] text-muted uppercase">
              {text.note}
            </p>
          </div>
        </div>

        <p data-reveal="fade" className="eyebrow mt-12 md:mt-[32px]">
          {text.eyebrow}
        </p>

        {!marquee && <Grid cards={cards} />}
      </Container>

      {marquee && <Marquee cards={cards} />}

      <Container>
        {/* Lưới 3 thẻ: sát dưới hàng thẻ như Figma (y 827). Băng chuyền (không có trong Figma): cách thẻ một khoảng rõ, kẻo trông dính vào thẻ */}
        <div data-reveal="fade" className={`mt-12 flex justify-end ${marquee ? "md:mt-14" : "md:mt-[14px]"}`}>
          <ArrowLink href={collection.more.href} className="text-wine uppercase">
            {collection.more.label}
          </ArrowLink>
        </div>
      </Container>
    </section>
  );
}
