"use client";
// Phân trang: ← Trước · 1 2 3 … 9 · Sau →. Trang đang xem màu rượu vang có gạch chân (aria-current). Nhiều trang thì rút gọn bằng "…"
// (luôn giữ trang đầu, trang cuối và hai trang quanh trang đang xem). Ở trang đầu / cuối thì nút Trước / Sau mờ, không bấm được
import { productsPage as t } from "@/content/home";
import { cx } from "@/components/ui/primitives";

// Danh sách số trang cần hiện, "…" ở chỗ bị rút gọn
export function pageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = [...new Set([1, total, current - 1, current, current + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  keep.forEach((n, i) => {
    const gap = n - (keep[i - 1] ?? n);
    if (gap === 2) out.push(n - 1);
    else if (gap > 2) out.push("…");
    out.push(n);
  });
  return out;
}

const step = "link-sm inline-flex min-h-10 items-center gap-2 px-2 uppercase tracking-[0.12em] transition-colors duration-300";

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  if (total <= 1) return null;
  return (
    <nav aria-label={t.pagination.label} className="mt-16 flex items-center justify-between gap-4 border-t border-rule pt-6 md:mt-20">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className={cx(step, "text-ink hover:text-wine disabled:pointer-events-none disabled:opacity-30")}>
        <span aria-hidden>←</span> <span className="hidden sm:inline">{t.pagination.prev}</span>
        <span className="sr-only sm:hidden">{t.pagination.prev}</span>
      </button>
      <ul className="flex items-center gap-1 sm:gap-2">
        {pageItems(page, total).map((n, i) =>
          n === "…" ? (
            <li key={`gap-${i}`} aria-hidden className="w-6 text-center text-[12px] text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                onClick={() => onChange(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={t.pagination.page(n)}
                className={cx("relative grid size-10 place-items-center text-[13px] tabular-nums transition-colors duration-300", n === page ? "text-wine" : "text-muted hover:text-ink")}
              >
                {n}
                <span className={cx("absolute inset-x-3 bottom-1.5 h-px bg-wine transition-transform duration-500", n === page ? "scale-x-100" : "scale-x-0")} />
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" disabled={page === total} onClick={() => onChange(page + 1)} className={cx(step, "text-ink hover:text-wine disabled:pointer-events-none disabled:opacity-30")}>
        <span className="hidden sm:inline">{t.pagination.next}</span>
        <span className="sr-only sm:hidden">{t.pagination.next}</span> <span aria-hidden>→</span>
      </button>
    </nav>
  );
}
