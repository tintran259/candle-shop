import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Một lựa chọn dạng thẻ (hũ, sáp, hương, bấc…). Trạng thái chọn có dấu tick,
 * không chỉ dựa vào màu. multi = chọn nhiều (checkbox), mặc định chọn một (radio).
 */
export function OptionCard({
  title,
  subtitle,
  price,
  media,
  selected,
  disabled,
  badge,
  multi,
  layout = "stack",
  onSelect,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  price?: string;
  media?: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  multi?: boolean;
  layout?: "stack" | "row";
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full cursor-pointer rounded-lg border bg-white text-left transition-[border-color,box-shadow,background-color] duration-300",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber",
        layout === "stack" ? "flex-col items-center gap-2 p-3 text-center" : "items-center gap-3 p-3",
        // Chừa chỗ cho dấu tick khi thẻ ngang không có ảnh
        layout === "row" && !media && "pl-9",
        selected
          ? "border-umber bg-cream-light ring-1 ring-umber"
          : "border-linen hover:border-umber/60",
        "disabled:cursor-not-allowed disabled:bg-white/60 disabled:opacity-55",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-2 left-2 flex size-5 items-center justify-center rounded-full border transition-colors",
          selected ? "border-umber bg-umber text-white" : "border-transparent",
        )}
      >
        {selected && <CheckIcon className="size-3" />}
      </span>
      {media && (
        <span className={cn("flex shrink-0 items-center justify-center", layout === "stack" ? "h-24 w-full" : "size-16")}>
          {media}
        </span>
      )}
      <span className={cn("flex min-w-0 flex-col gap-0.5", layout === "stack" && "items-center")}>
        <span className="text-sm font-semibold break-words text-bark">{title}</span>
        {subtitle && <span className="text-xs text-dark-300">{subtitle}</span>}
        {price && <span className="text-xs font-medium text-bark">{price}</span>}
        {badge && (
          <span className="mt-1 w-fit rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-umber">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}
