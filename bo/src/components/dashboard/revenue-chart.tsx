"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatDate, formatMoney, formatMoneyCompact } from "@/lib/format";
import { dailyRevenue } from "@/lib/mock";
import { cn } from "@/lib/utils";

const ranges = [
  { days: 7, label: "7 ngày" },
  { days: 30, label: "30 ngày" },
  { days: 90, label: "90 ngày" },
] as const;

const config = {
  revenue: { label: "Doanh thu", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RevenueChart() {
  const [days, setDays] = useState<number>(30);
  const data = dailyRevenue.slice(-days);
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading text-lg">Doanh thu</CardTitle>
          <CardDescription>
            <span className="font-heading text-2xl font-semibold text-foreground tabular-nums">{formatMoney(total)}</span>
            <span className="ml-2">trong {days} ngày qua</span>
          </CardDescription>
        </div>
        {/* Bộ lọc thời gian nằm trên biểu đồ */}
        <div role="radiogroup" aria-label="Khoảng thời gian" className="flex rounded-full bg-muted p-1 text-sm">
          {ranges.map((r) => (
            <button
              key={r.days}
              type="button"
              role="radio"
              aria-checked={days === r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 transition-colors",
                days === r.days ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={config} className="aspect-auto h-[280px] w-full" aria-label={`Biểu đồ doanh thu ${days} ngày`}>
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={28}
              tickFormatter={formatDate}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickMargin={6}
              tickFormatter={formatMoneyCompact}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
                    return row ? `${formatDate(row.date)} · ${row.orders} đơn` : "";
                  }}
                  formatter={(value) => (
                    <span className="flex w-full justify-between gap-6">
                      <span className="text-muted-foreground">Doanh thu</span>
                      <span className="font-semibold tabular-nums">{formatMoney(Number(value))}</span>
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              fill="url(#fill-revenue)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
              animationDuration={600}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
