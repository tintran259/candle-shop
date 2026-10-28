import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hiển thị số sao, hỗ trợ nửa sao (vd. 4.5) */
export function StarRating({
  value,
  className,
  starClassName = "size-5",
}: {
  value: number;
  className?: string;
  starClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1.5", className)} aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(Math.max(value - i, 0), 1);
        return (
          <span key={i} className="relative inline-flex">
            <StarIcon className={cn(starClassName, "text-brand-500")} strokeWidth={1.5} />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarIcon className={cn(starClassName, "fill-brand-500 text-brand-500")} strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
