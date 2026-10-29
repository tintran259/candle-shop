import { Card, Flex, Typography } from "antd";
import { formatMoneyShort } from "@/lib/format";
import { salesByType } from "@/lib/mock";
import { brand } from "@/theme";

// Thanh ngang màu chuyển, nhãn và số nằm ngay trong thanh (độ dài theo tỉ lệ với loại cao nhất)
export function SalesByType() {
  const max = Math.max(...salesByType.map((r) => r.revenue));
  return (
    <Card title="Theo loại hương" extra={<Typography.Text type="secondary">30 ngày qua</Typography.Text>} style={{ height: "100%" }}>
      <Flex vertical gap={10} component="ul" style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {salesByType.map((r) => (
          <Flex
            key={r.type}
            component="li"
            justify="space-between"
            align="center"
            style={{
              // Tối thiểu 55% để chữ luôn nằm vừa trong thanh
              width: `${Math.max(55, (r.revenue / max) * 100)}%`,
              height: 40,
              padding: "0 12px",
              borderRadius: 10,
              background: `linear-gradient(90deg, ${brand.emberMid}, ${brand.emberLight})`,
            }}
          >
            <Typography.Text strong>{r.type}</Typography.Text>
            <Typography.Text strong className="tabular" style={{ fontSize: 13 }}>
              {formatMoneyShort(r.revenue)}
            </Typography.Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}
