import { Card, Typography } from "antd";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyRevenue } from "@/lib/dashboard/stats";
import { formatDate, formatMoney, formatMoneyAxis, formatMoneyShort } from "@/lib/format";
import { brand } from "@/theme";

// Cột theo ngày: shop ít đơn nên có nhiều ngày bằng 0, đường cong sẽ vẽ sai giữa các ngày. Doanh thu âm là ngày hoàn tiền nhiều hơn thu
export function RevenueChart({ data, days }: { data: DailyRevenue[]; days: number }) {
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <Card title="Doanh thu">
      <span className="big-number" style={{ fontSize: 40, lineHeight: 1.15, display: "block" }}>
        {formatMoneyShort(total)}
      </span>
      <Typography.Text type="secondary">tiền hàng thực nhận trong {days} ngày qua, không gồm phí vận chuyển</Typography.Text>
      <div style={{ height: 280, marginTop: 16 }} role="img" aria-label={`Biểu đồ doanh thu ${days} ngày, tổng ${formatMoney(total)}`}>
        <ResponsiveContainer initialDimension={{ width: 640, height: 280 }}>
          <BarChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <CartesianGrid stroke="#f1f1f1" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} tickFormatter={formatDate} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={formatMoneyAxis} fontSize={12} />
            <Tooltip
              cursor={{ fill: "#f6f6f3" }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as DailyRevenue | undefined;
                if (!active || !row) return null;
                return (
                  <Card size="small">
                    <Typography.Text type="secondary">
                      {formatDate(row.date)} · {row.orders} đơn mới
                    </Typography.Text>
                    <br />
                    <Typography.Text strong className="tabular">
                      {formatMoney(row.revenue)}
                    </Typography.Text>
                  </Card>
                );
              }}
            />
            <Bar dataKey="revenue" fill={brand.ember} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={600} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
