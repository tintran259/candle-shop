import { Avatar, Badge, Flex, Tag, Typography } from "antd";
import { stockLevel, unitLabel } from "@/lib/craft/groups";
import type { Stock, StepOption } from "@/lib/craft/types";
import { formatNumber } from "@/lib/format";

// Ảnh chính nếu có, không thì ô màu (hoặc sọc khi không có màu)
export function MaterialAvatar({ item, swatch = true }: { item: StepOption; swatch?: boolean }) {
  const count = item.images?.length ?? 0;
  if (count) {
    return (
      <Badge count={count > 1 ? count : 0} size="small" color="#0c0d12" offset={[-2, 34]}>
        <Avatar shape="square" size={40} src={item.images![0]} alt="" />
      </Badge>
    );
  }
  if (!swatch) return null;
  return (
    <Avatar
      shape="square"
      size={40}
      style={{
        background: item.swatch ?? "repeating-linear-gradient(45deg,#efe4dc 0 4px,#fdfbf7 4px 8px)",
        border: "1px solid #f0f0f0",
      }}
    />
  );
}

export function StockText({ item }: { item: Stock }) {
  const level = stockLevel(item);
  if (level === "unlimited") return <Typography.Text type="secondary">Không theo dõi</Typography.Text>;
  return (
    <Flex vertical align="flex-start" gap={4}>
      <Typography.Text strong className="tabular">
        {formatNumber(item.stock)} {unitLabel[item.unit]}
      </Typography.Text>
      {level === "out" && <Tag color="error">Hết hàng</Tag>}
      {level === "low" && <Tag color="warning">Sắp hết</Tag>}
    </Flex>
  );
}
