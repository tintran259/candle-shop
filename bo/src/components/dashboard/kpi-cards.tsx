import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatMoneyExact, formatNumber, formatPercent } from "@/lib/format";
import { kpis } from "@/lib/mock";
import { cn } from "@/lib/utils";

const items = [
  { label: "Doanh thu", value: formatMoney(kpis.revenue.value), delta: kpis.revenue.delta },
  { label: "Đơn hàng", value: formatNumber(kpis.orders.value), delta: kpis.orders.delta },
  { label: "Giá trị đơn TB", value: formatMoneyExact(kpis.aov.value), delta: kpis.aov.delta },
  { label: "Khách hàng mới", value: formatNumber(kpis.customers.value), delta: kpis.customers.delta },
];

export function KpiCards() {
  return (
    <section aria-label="Chỉ số 30 ngày" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const up = item.delta >= 0;
        const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
        return (
          <Card key={item.label} className="gap-0 py-5">
            <CardContent className="flex flex-col gap-3 px-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{item.value}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
                    up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {formatPercent(item.delta)}
                </span>
                so với 30 ngày trước
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
