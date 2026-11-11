"use client";
// Thẻ sản phẩm: ảnh vuông (rê chuột: phóng nhẹ, có ảnh thứ hai thì chuyển sang ảnh đó), nhãn Mới / Giảm %, danh mục, tên, giá (giá giảm + giá gốc gạch),
// nốt hương, mức hương · cỡ · giờ cháy, nút "Liên hệ đặt nến" (Zalo theo SĐT ở BO › Cài đặt; chưa có SĐT thì không hiện). Ảnh lỗi / chưa có thì hiện logo nhạt thay ảnh.
// Thẻ là cột co giãn, cao bằng thẻ cao nhất cùng hàng; nút luôn nằm đáy thẻ nên mô tả dài / ngắn thì nút các thẻ vẫn thẳng hàng.
// Bấm ảnh / tên mở trang chi tiết: liên kết ở tên phủ cả thẻ (after:inset-0), nút Liên hệ nằm trên lớp đó nên vẫn bấm riêng được
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { productsPage } from "@/content/home";
import { aromaLabels, cloudinary, formatPrice, productUrl, sizeLabels, type ShopProduct } from "@/lib/shop";
import { cx, Logo } from "@/components/ui/primitives";
import { ContactButton } from "@/components/products/contact-button";

export function ProductCard({ product: p, category, contactUrl, heading: H = "h2" }: { product: ShopProduct; category?: string; contactUrl: string | null; heading?: "h2" | "h3" }) {
  const [broken, setBroken] = useState<number[]>([]);
  const images = p.images.slice(0, 2).filter((_, i) => !broken.includes(i));
  const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const meta = [aromaLabels[p.aromaLevel], sizeLabels[p.size], p.burnTime && productsPage.burn(p.burnTime)].filter(Boolean).join(" · ");

  return (
    <article className="group relative flex w-full flex-col">
      <div className="relative aspect-square overflow-hidden bg-rule/25">
        {images.length ? (
          images.map((src, i) => (
            <Image
              key={src}
              src={cloudinary(src, 900)}
              alt={i === 0 ? p.name : ""}
              fill
              unoptimized
              sizes="(min-width: 768px) 30vw, 50vw"
              onError={() => setBroken((b) => [...b, p.images.indexOf(src)])}
              className={cx(
                "object-cover transition-[scale,opacity] duration-700 ease-out group-hover:scale-[1.04]",
                i === 1 && "opacity-0 group-hover:opacity-100",
                i === 0 && images.length > 1 && "group-hover:opacity-0",
              )}
            />
          ))
        ) : (
          <div className="absolute inset-0 grid place-items-center text-rule">
            <Logo className="w-[46%]" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {p.isNew && <span className="bg-cream px-2 py-1 text-[9px] tracking-[0.12em] text-wine uppercase">{productsPage.badgeNew}</span>}
          {off > 0 && <span className="bg-wine px-2 py-1 text-[9px] tracking-[0.08em] text-cream">−{off}%</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        {category && <p className="text-[9px] tracking-[0.11em] text-muted uppercase">{category}</p>}
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <H className="display text-[22px] tracking-[0.02em] text-wine md:text-[26px]">
            <Link
              href={productUrl(p)}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-1 focus-visible:after:outline-offset-4"
            >
              {p.name}
            </Link>
          </H>
          <p className="shrink-0 text-[13px] text-muted tabular-nums">
            {p.salePrice ? (
              <>
                <span className="text-wine">{formatPrice(p.salePrice)}</span> <s className="ml-1 text-[11px] opacity-70">{formatPrice(p.price)}</s>
              </>
            ) : (
              formatPrice(p.price)
            )}
          </p>
        </div>
        {p.scent && <p className="mt-2 text-[12px] text-muted">{p.scent}</p>}
        <p className="mt-3 text-[10px] text-muted">{meta}</p>
        {contactUrl && (
          <>
            {/* mt-auto: đẩy nút xuống đáy thẻ; pt-5: cách chữ tối thiểu 20px ở thẻ cao nhất hàng */}
            <div className="relative z-10 mt-auto pt-5">
              <ContactButton href={contactUrl} product={p.name} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}
