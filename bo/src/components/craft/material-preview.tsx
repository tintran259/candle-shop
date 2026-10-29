import { Avatar, Flex, Form, Tag, Typography } from "antd";
import type { MaterialFormValues } from "@/components/craft/material-form";
import { formatDelta, stockLevel, unitLabel } from "@/lib/craft/groups";
import type { Stock } from "@/lib/craft/types";
import { formatNumber } from "@/lib/format";
import { brand, radius } from "@/theme";

const levelTag = {
  out: { color: "error", label: "Hết hàng" },
  low: { color: "warning", label: "Sắp hết" },
  ok: { color: "success", label: "Còn hàng" },
  unlimited: { color: "default", label: "Không theo dõi" },
} as const;

// Thẻ xem trước đầu drawer — cập nhật theo từng thay đổi trong form
export function MaterialPreview({ unit, swatch, groupLabel }: { unit: Stock["unit"]; swatch: boolean; groupLabel: string }) {
  const form = Form.useFormInstance<MaterialFormValues>();
  const v = Form.useWatch([], { form, preserve: true }) as MaterialFormValues | undefined;
  if (!v) return null;

  const stock: Stock = { stock: v.unlimited ? Infinity : (v.stock ?? 0), unit };
  const level = stockLevel(stock);
  const image = v.images?.[0];

  return (
    <section aria-label="Xem trước" style={{ background: "#fff", borderRadius: radius.card, padding: 20 }}>
      <Flex gap={16} align="center">
        <Avatar
          shape="square"
          size={72}
          src={image}
          alt=""
          style={{
            borderRadius: 16,
            flexShrink: 0,
            background: image ? undefined : swatch && v.swatch ? v.swatch : brand.emberLight,
            border: "1px solid #f1f1f1",
          }}
        />
        <Flex vertical style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {groupLabel}
          </Typography.Text>
          <Typography.Title level={4} ellipsis style={{ margin: 0 }}>
            {v.nameVi?.trim() || "Nguyên liệu mới"}
          </Typography.Title>
          <Flex gap={6} wrap style={{ marginTop: 6 }}>
            <Tag color={v.available ? "success" : "default"}>{v.available ? "Đang bán" : "Tạm ẩn"}</Tag>
            <Tag color={levelTag[level].color}>{levelTag[level].label}</Tag>
          </Flex>
        </Flex>
      </Flex>

      <Flex gap={12} style={{ marginTop: 20 }}>
        <Figure label="Phụ thu mỗi hũ" value={v.price ? formatDelta(v.price) : "0 ₫"} />
        <Figure
          label="Tồn kho"
          value={v.unlimited ? "∞" : formatNumber(v.stock ?? 0)}
          unit={v.unlimited ? undefined : unitLabel[unit]}
        />
      </Flex>
    </section>
  );
}

function Figure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Flex vertical style={{ flex: 1, background: "#f6f6f3", borderRadius: 14, padding: "12px 16px" }}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <span className="big-number" style={{ fontSize: 30, lineHeight: 1.2 }}>
        {value}
        {unit && <span style={{ fontSize: 15, marginLeft: 4, color: "#6b6b6b" }}>{unit}</span>}
      </span>
    </Flex>
  );
}
