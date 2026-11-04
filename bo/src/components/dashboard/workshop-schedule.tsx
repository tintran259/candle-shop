import { Card, Flex, Progress, Typography } from "antd";
import dayjs from "dayjs";
import { MoreLink } from "@/components/more-link";
import type { DayLoad } from "@/lib/capacity";

const weekday = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Lịch xưởng các ngày tới: số cây đã nhận theo ngày làm xong so với công suất (Cài đặt › Xưởng)
export function WorkshopSchedule({ rows }: { rows: DayLoad[] }) {
  const capacity = rows[0]?.capacity ?? 0;
  const over = rows.filter((r) => r.over).length;
  return (
    <Card
      title="Lịch xưởng"
      extra={<MoreLink to="/orders?sort=ready-soon">Đơn sắp tới hạn</MoreLink>}
      styles={{ body: { paddingTop: 12 } }}
    >
      {capacity ? (
        <Typography.Paragraph type={over ? "danger" : "secondary"} style={{ marginBottom: 12 }}>
          7 ngày tới · {over ? `${over} ngày vượt công suất ${capacity} cây/ngày` : `công suất ${capacity} cây/ngày`}
        </Typography.Paragraph>
      ) : (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          7 ngày tới · chưa đặt công suất xưởng (Cài đặt › Xưởng).
        </Typography.Paragraph>
      )}
      <Flex vertical gap={8} role="list" aria-label="Số cây theo ngày làm xong">
        {rows.map((r) => {
          const d = dayjs(r.date);
          const label = d.isSame(dayjs(), "day") ? "Hôm nay" : `${weekday[d.day()]} ${d.format("DD/MM")}`;
          return (
            <Flex key={r.date} role="listitem" align="center" gap={12}>
              <Typography.Text style={{ width: 76, flexShrink: 0, fontSize: 13 }}>{label}</Typography.Text>
              <Progress
                percent={capacity ? Math.min(100, Math.round((r.load / capacity) * 100)) : 0}
                status={r.over ? "exception" : "normal"}
                showInfo={false}
                strokeColor={r.over ? undefined : r.load >= capacity * 0.8 ? "#fa8c16" : "#52c41a"}
                aria-label={`${label}: ${r.load} cây`}
                style={{ flex: 1, margin: 0 }}
              />
              <Typography.Text type={r.over ? "danger" : "secondary"} className="tabular" style={{ width: 64, textAlign: "right", fontSize: 13 }}>
                {r.load}
                {capacity ? `/${capacity}` : ""} cây
              </Typography.Text>
            </Flex>
          );
        })}
      </Flex>
    </Card>
  );
}
