import { Card, Segmented, Typography } from "antd";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, formatMoney, formatMoneyAxis, formatMoneyShort } from "@/lib/format";
import { dailyRevenue, type DailyRevenue } from "@/lib/mock";
import { brand } from "@/theme";

const ranges = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

export function RevenueChart() {
  const [days, setDays] = useState(30);
  const data = dailyRevenue.slice(-days);
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <Card
      title="Doanh thu"
      extra={<Segmented size="small" options={ranges} value={days} onChange={setDays} aria-label="Khoảng thời gian" />}
    >
      <span className="big-number" style={{ fontSize: 40, lineHeight: 1.15, display: "block" }}>
        {formatMoneyShort(total)}
      </span>
      <Typography.Text type="secondary">trong {days} ngày qua</Typography.Text>
      <div style={{ height: 280, marginTop: 16 }} role="img" aria-label={`Biểu đồ doanh thu ${days} ngày`}>
        <ResponsiveContainer initialDimension={{ width: 640, height: 280 }}>
          <AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand.ember} stopOpacity={0.22} />
                <stop offset="100%" stopColor={brand.ember} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f1f1" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} tickFormatter={formatDate} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={formatMoneyAxis} fontSize={12} />
            <Tooltip
              cursor={{ stroke: "#bfbfbf", strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as DailyRevenue | undefined;
                if (!active || !row) return null;
                return (
                  <Card size="small">
                    <Typography.Text type="secondary">
                      {formatDate(row.date)} · {row.orders} đơn
                    </Typography.Text>
                    <br />
                    <Typography.Text strong className="tabular">
                      {formatMoney(row.revenue)}
                    </Typography.Text>
                  </Card>
                );
              }}
            />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke={brand.ember}
              strokeWidth={2}
              fill="url(#fill-revenue)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
