// Một thẻ nến của khối Xưởng nến (ảnh 416×420, nhóm hương, tên + giá, nốt hương, cỡ · giờ cháy) — dùng cho lưới 3 thẻ và băng chuyền
import { Logo, Photo } from "@/components/ui/primitives";
import type { FeaturedCard } from "@/lib/home";

export function CollectionCard({ card: p, parallax, sizes }: { card: FeaturedCard; parallax: number; sizes: string }) {
  return (
    <a href={p.href} className="group block">
      {p.photo ? (
        <Photo photo={{ ...p.photo, width: 1024, height: 1024 }} sizes={sizes} className="aspect-[416/420]" parallax={parallax} zoom />
      ) : (
        <div data-reveal="clip" className="grid aspect-[416/420] place-items-center bg-rule/25 text-rule">
          <Logo className="w-[46%]" />
        </div>
      )}
      <div data-reveal="fade" className="pt-[26px]">
        <p className="text-[9px] tracking-[0.11em] text-muted uppercase">{p.category}</p>
        <div className="mt-2.5 flex items-baseline justify-between gap-4">
          <h3 className="display text-[27px] tracking-[0.02em] text-wine">
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
              {p.name}
            </span>
          </h3>
          <span className="shrink-0 text-[13px] text-muted">{p.price}</span>
        </div>
        <p className="mt-2 text-[12px] text-muted">{p.notes}</p>
        <p className="mt-4 text-[10px] text-muted">{p.details}</p>
      </div>
    </a>
  );
}
