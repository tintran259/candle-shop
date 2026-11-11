// Dải cam kết (Figma 2:6): 4 nhãn in hoa canh giữa, vạch dọc giữa các nhãn (vạch mọc lên khi cuộn tới). Điện thoại: lưới 2×2, bỏ vạch
import { promises } from "@/content/home";
import { Container } from "@/components/ui/primitives";

export function Promises() {
  return (
    <section aria-label="Cam kết của chúng tôi">
      <Container>
        <ul className="grid grid-cols-2 gap-y-6 py-10 md:flex md:items-center md:py-10">
          {promises.map((p, i) => (
            <li key={p} className="flex flex-1 items-center">
              {i > 0 && <span data-reveal="vline" aria-hidden className="hidden h-8 w-px bg-divider md:block" />}
              <p data-reveal="fade" className="flex-1 px-2 text-center text-[10px] tracking-[0.14em] text-muted uppercase">
                {p}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
