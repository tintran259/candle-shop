import Image from "next/image";
import { CandlePreview } from "@/components/customizer/candle-preview";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/stores/cart-store";

// Ảnh dòng sản phẩm trong giỏ: ảnh mẫu, hoặc ảnh xem trước nếu là nến tự phối
export function CartThumb({ item, sizes, className }: { item: CartItem; sizes: string; className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden", item.craft && "bg-brand-50", className)}>
      {item.craft ? (
        <CandlePreview look={item.craft.preview} animated={false} className="absolute inset-0 m-auto h-full p-1.5" />
      ) : (
        <Image src={item.image} alt={item.name} fill sizes={sizes} className="object-cover" />
      )}
    </div>
  );
}
