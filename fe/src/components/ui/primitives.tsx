// Thành phần nhỏ dùng lại giữa các section
import Image from "next/image";
import type { Photo as PhotoData } from "@/content/home";
import { cloudinaryFit } from "@/lib/shop";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// Khung theo lưới Figma: rộng 1440, lề 64px (điện thoại 20px)
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-16", className)}>{children}</div>;
}

// Logo 2510 Candle: ảnh mặt nạ (public/brand/logo-2510.png, 1600×374, nền trong suốt) tô bằng màu chữ hiện tại —
// đổi màu bằng class text-* (text-linen trắng trên hero, text-copper trên nền kem). Đặt chiều rộng, chiều cao tự theo tỉ lệ
const LOGO_MASK = {
  aspectRatio: "1600 / 374",
  maskImage: "url(/brand/logo-2510.png)",
  WebkitMaskImage: "url(/brand/logo-2510.png)",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
} as const;

export function Logo({ className, label }: { className?: string; label?: string }) {
  return <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cx("block bg-current", className)} style={LOGO_MASK} />;
}

// Logo tải lên ở BO › Giao diện web (src) hoặc logo mặt nạ có sẵn tô theo màu chữ. Đặt chiều rộng qua className.
// capHeight (mặc định): logo tải lên cao tối đa 64px cho vừa thanh điều hướng; chân trang tắt để logo tải lên to bằng logo có sẵn (theo chiều rộng)
export function BrandLogo({ src, className, label, capHeight = true }: { src?: string; className?: string; label?: string; capHeight?: boolean }) {
  if (!src) return <Logo className={className} label={label} />;
  return <Image src={cloudinaryFit(src, 600)} alt={label ?? ""} width={600} height={140} unoptimized className={cx("block h-auto object-contain object-left", capHeight && "max-h-16", className)} />;
}

// Liên kết chữ nhỏ + mũi tên ↗; rê chuột: gạch chân chạy ra, mũi tên nhích lên phải
export function ArrowLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={cx("link-sm group -my-2.5 inline-flex items-center gap-3 py-2.5", className)}>
      <span className="relative">
        {children}
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 group-hover:scale-x-100" />
      </span>
      <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        ↗
      </span>
    </a>
  );
}

// Ảnh có hiệu ứng mở khung + trôi chậm khi cuộn; ảnh lớn hơn khung 16% để trôi không lộ mép. zoom: phóng nhẹ khi rê chuột lên thẻ (group)
export function Photo({ photo, sizes, className, parallax = 6, zoom }: { photo: PhotoData; sizes: string; className?: string; parallax?: number; zoom?: boolean }) {
  return (
    <div data-reveal="clip" className={cx("relative overflow-hidden bg-rule/30", className)}>
      <div data-parallax={parallax} className={cx("absolute inset-x-0 -inset-y-[8%]", zoom && "transition-[scale] duration-700 ease-out group-hover:scale-105")}>
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} unoptimized={!photo.src.startsWith("/")} className="object-cover" />
      </div>
    </div>
  );
}
