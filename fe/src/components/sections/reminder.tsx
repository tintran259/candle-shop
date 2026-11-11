// Lời nhắn nhỏ (Figma 2:10): nhãn, câu trích dẫn 2 dòng màu rượu vang canh giữa (sáng dần từng chữ khi cuộn), chữ ký
import { reminder } from "@/content/home";
import { Container } from "@/components/ui/primitives";

export function Reminder() {
  return (
    <section aria-label={reminder.eyebrow} className="py-16 text-center md:pt-14 md:pb-[55px]">
      <Container>
        <p data-reveal="fade" className="text-[11px] tracking-[0.18em] text-muted uppercase">
          {reminder.eyebrow}
        </p>
        <blockquote data-reveal="words" className="display mx-auto mt-6 max-w-[1180px] text-[clamp(32px,3.4vw,49px)] leading-[1.08] text-wine">
          {reminder.quote.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </blockquote>
        <p data-reveal="fade" className="eyebrow mt-10">
          {reminder.signature}
        </p>
      </Container>
    </section>
  );
}
