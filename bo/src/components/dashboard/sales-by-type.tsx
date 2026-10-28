"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";
import { salesByType } from "@/lib/mock";

const config = {
  revenue: { label: "Doanh thu", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SalesByType() {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Doanh thu theo loại hương</CardTitle>
        <CardDescription>30 ngày qua</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[240px] w-full" aria-label="Doanh thu theo loại hương">
          <BarChart data={salesByType} layout="vertical" margin={{ left: 0, right: 64 }} barCategoryGap={10}>
            <YAxis dataKey="type" type="category" tickLine={false} axisLine={false} width={100} />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={<ChartTooltipContent hideLabel formatter={(v, _n, item) => (
                <span className="flex w-full justify-between gap-6">
                  <span className="text-muted-foreground">{item.payload.type}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(Number(v))}</span>
                </span>
              )} />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} maxBarSize={30} animationDuration={600}>
              {/* Nhãn trực tiếp ở cuối cột, màu chữ chứ không dùng màu dữ liệu */}
              <LabelList
                dataKey="revenue"
                position="right"
                offset={10}
                className="fill-foreground text-xs font-semibold tabular-nums"
                formatter={(v) => formatMoney(Number(v))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
        {/* Bảng dữ liệu cho trình đọc màn hình */}
        <table className="sr-only">
          <caption>Doanh thu theo loại hương, 30 ngày qua</caption>
          <tbody>
            {salesByType.map((r) => (
              <tr key={r.type}>
                <th scope="row">{r.type}</th>
                <td>{formatMoney(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
