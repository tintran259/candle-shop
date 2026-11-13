// Dải cam kết (Figma 2:6): 4 nhãn in hoa canh giữa ô 296px, vạch dọc cách nhãn trước 33px, nhãn sau 8px (x 393 / 731 / 1069 ở 1440; vạch mọc lên khi cuộn tới). Điện thoại: lưới 2×2, bỏ vạch
import { promises } from "@/content/home";
import { Container } from "@/components/ui/primitives";

export function Promises() {
  return (
    <section aria-label="Cam kết của chúng tôi">
      <Container>
        <ul className="grid grid-cols-2 gap-y-6 py-10 md:grid-cols-[296fr_338fr_338fr_338fr] md:items-center md:py-10">
          {promises.map((p, i) => (
            <li key={p} className={i > 0 ? "md:grid md:grid-cols-[33fr_1px_8fr_296fr] md:items-center" : undefined}>
              {i > 0 && <span data-reveal="vline" aria-hidden className="hidden h-8 w-px bg-divider md:col-start-2 md:block" />}
              <p data-reveal="fade" className="px-2 text-center text-[10px] tracking-[0.14em] text-muted uppercase md:col-start-4 md:-mt-0.5">
                {p}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
