"use client";

import { CircleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ConfigIssue } from "@/lib/customizer/types";

// Thông báo lỗi ngay dưới mục bị ảnh hưởng (vd đổi hũ làm kích thước không còn hợp)
export function IssueMessage({ issues }: { issues: ConfigIssue[] }) {
  const t = useTranslations("Customizer.issues");
  if (issues.length === 0) return null;
  const issue = issues[0];
  const key = issue.code === "incompatible" ? `incompatible_${issue.field}` : issue.code;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose/10 px-3 py-2 text-sm text-[#a33a3a]">
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t(key, issue.params ?? {})}
    </p>
  );
}
