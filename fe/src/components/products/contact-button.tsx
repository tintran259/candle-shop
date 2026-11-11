// Nút "Liên hệ đặt nến": mở chat Zalo của shop ở tab mới (link từ SĐT người gửi ở BO › Cài đặt).
// outline: viền rượu vang, rê chuột thì tô đầy (thẻ sản phẩm); solid: nền rượu vang, rê chuột sẫm lại (trang chi tiết)
import { productsPage } from "@/content/home";
import { cx } from "@/components/ui/primitives";

export function ContactButton({ href, product, variant = "outline", className }: { href: string; product: string; variant?: "outline" | "solid"; className?: string }) {
  const solid = variant === "solid";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={productsPage.contact.aria(product)}
      className={cx(
        "group/btn relative isolate flex items-center justify-center gap-2 overflow-hidden border border-wine px-3 tracking-[0.14em] uppercase transition-colors duration-500",
        solid ? "min-h-14 bg-wine text-[12px] text-cream" : "min-h-11 text-[10px] text-wine hover:text-cream sm:text-[11px]",
        className,
      )}
    >
      <span aria-hidden className={cx("absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-500 group-hover/btn:scale-y-100", solid ? "bg-wine-dark" : "bg-wine")} />
      {productsPage.contact.label}
      <span aria-hidden className="transition-transform duration-500 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
        ↗
      </span>
    </a>
  );
}
