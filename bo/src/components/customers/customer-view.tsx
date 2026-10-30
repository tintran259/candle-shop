import { StopOutlined } from "@ant-design/icons";
import { Avatar, Tag, Tooltip } from "antd";
import { segmentMeta, type Segment } from "@/lib/customers/stats";
import type { Customer } from "@/lib/customers/types";
import { initials } from "@/lib/format";
import { brand } from "@/theme";

// Avatar chữ viết tắt; khách bị chặn thì xám
export function CustomerAvatar({ customer, size = 40 }: { customer: Customer; size?: number }) {
  return (
    <Avatar
      size={size}
      style={{
        background: customer.blocked ? "#f0f0f0" : brand.emberLight,
        color: customer.blocked ? "#6b6b6b" : brand.emberDark,
        fontWeight: 600,
        flexShrink: 0,
        fontSize: size >= 56 ? 20 : undefined,
      }}
    >
      {initials(customer.name)}
    </Avatar>
  );
}

// Tag nhóm khách (màu luôn kèm chữ, rê chuột xem cách tính); bị chặn thì hiện "Đã chặn"
export function SegmentTag({ segment, blocked }: { segment: Segment; blocked?: boolean }) {
  if (blocked)
    return (
      <Tag color="red" icon={<StopOutlined />} style={{ marginInlineEnd: 0 }}>
        Đã chặn
      </Tag>
    );
  const meta = segmentMeta[segment];
  return (
    <Tooltip title={meta.hint}>
      <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
        {meta.label}
      </Tag>
    </Tooltip>
  );
}
