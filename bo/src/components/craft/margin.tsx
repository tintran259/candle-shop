import { WarningOutlined } from "@ant-design/icons";
import { Button, Flex, Tooltip, Typography } from "antd";
import type { ReactNode } from "react";
import { belowCost, lowMargin, type PriceCheck } from "@/lib/craft/pricing";
import { formatMoney } from "@/lib/format";

// Thấp hơn giá vốn: đỏ. Lãi dưới mức tối thiểu: cam. Còn lại: "lãi 62%" màu phụ
function Status({ c, min, free }: { c: PriceCheck; min: number; free?: string }) {
  if (belowCost(c))
    return (
      <Typography.Text type="danger" style={{ whiteSpace: "nowrap" }}>
        <WarningOutlined aria-hidden /> Thấp hơn vốn {formatMoney(c.floor - c.price)}
      </Typography.Text>
    );
  if (c.margin === null) return <Typography.Text type="secondary">{free ?? "Không tốn nguyên liệu"}</Typography.Text>;
  const low = lowMargin(c, min);
  return (
    <Typography.Text type={low ? "warning" : "secondary"} style={{ whiteSpace: "nowrap" }}>
      {low && <WarningOutlined aria-hidden style={{ marginInlineEnd: 4 }} />}
      lãi {Math.round(c.margin * 100)}%{low && <span className="sr-only"> (dưới mức {min}%)</span>}
    </Typography.Text>
  );
}

// Nguyên liệu chưa có giá nhập — giá vốn đang thiếu phần này
function MissingCost({ c }: { c: PriceCheck }) {
  if (!c.missing.length) return null;
  return (
    <Tooltip title={`Chưa có giá nhập: ${c.missing.map((m) => m.name).join(", ")}. Đặt giá trong Kho để tính đủ giá vốn.`}>
      <Typography.Text type="warning" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
        Thiếu giá {c.missing.length} nguyên liệu
      </Typography.Text>
    </Tooltip>
  );
}

// Nút điền giá gợi ý — chỉ hiện khi cao hơn giá đang đặt, chỉ điền khi admin bấm
export function SuggestButton({ value, current, label, onApply }: { value: number; current: number; label: string; onApply: (n: number) => void }) {
  if (value <= current) return null;
  return (
    <Button type="link" size="small" style={{ padding: 0, height: "auto" }} aria-label={`${label}: ${formatMoney(value)}`} onClick={() => onApply(value)}>
      Gợi ý {formatMoney(value)}
    </Button>
  );
}

// "Vốn 16.000 ₫ · cỡ 200ml" rồi trạng thái so với giá bán. inline: một hàng (dưới ô nhập trong drawer). status: thay trạng thái mặc định
export function CostCheck({
  c,
  min,
  note,
  free,
  inline,
  status,
  children,
}: {
  c: PriceCheck;
  min: number;
  note?: string;
  free?: string;
  inline?: boolean;
  status?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Flex vertical={!inline} wrap={inline} gap={inline ? 8 : 2} align={inline ? "center" : undefined} style={{ fontSize: 13 }}>
      <Typography.Text className="tabular" style={{ whiteSpace: "nowrap", fontSize: 13 }}>
        Vốn {formatMoney(c.floor)}
        {c.per && `/${c.per}`}
        {note && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {" "}
            · {note}
          </Typography.Text>
        )}
      </Typography.Text>
      {status ?? <Status c={c} min={min} free={free} />}
      <MissingCost c={c} />
      {children}
    </Flex>
  );
}
