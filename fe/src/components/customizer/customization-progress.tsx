"use client";

import { useTranslations } from "next-intl";
import { customizerGroups, scrollToGroup } from "@/components/customizer/groups";
import type { GroupId } from "@/lib/customizer/types";
import { cn } from "@/lib/utils";

// Thanh 7 bước đánh số; bước đang xem tô đậm, bước còn lỗi có chấm đỏ
export function CustomizationProgress({ active, withIssues }: { active: GroupId; withIssues: Set<GroupId> }) {
  const t = useTranslations("Customizer");
  return (
    <nav aria-label={t("progressLabel")} className="overflow-x-auto pb-1 [scrollbar-width:none]">
      <ol className="flex min-w-max items-center gap-2 xl:min-w-0 xl:justify-between">
        {customizerGroups.map((g, i) => {
          const current = g.id === active;
          return (
            <li key={g.id} className="flex items-center gap-2 xl:flex-1 xl:last:flex-none">
              <button
                type="button"
                aria-current={current ? "step" : undefined}
                onClick={() => scrollToGroup(g.id)}
                className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pr-2 text-sm whitespace-nowrap transition-colors"
              >
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full border text-sm transition-colors duration-300",
                    current ? "border-umber bg-umber text-white" : "border-linen bg-white text-bark",
                  )}
                >
                  {i + 1}
                  {withIssues.has(g.id) && (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-cream bg-rose" />
                  )}
                </span>
                <span className={cn(current ? "font-semibold text-bark" : "text-dark-300")}>{t(`groups.${g.id}`)}</span>
              </button>
              {i < customizerGroups.length - 1 && (
                <span aria-hidden className="h-px w-6 bg-linen xl:w-auto xl:flex-1" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
