import { ExperimentOutlined } from "@ant-design/icons";
import { Avatar, Flex, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { deadline, paymentState, paymentStateMeta, statusMeta } from "@/lib/orders/labels";
import type { Order, OrderItem, OrderStatus } from "@/lib/orders/types";
import { brand } from "@/theme";

export function StatusTag({ status }: { status: OrderStatus }) {
  return (
    <Tag color={statusMeta[status].color} style={{ marginInlineEnd: 0 }}>
      {statusMeta[status].label}
    </Tag>
  );
}

export function PaymentTag({ order }: { order: Order }) {
  const s = paymentState(order);
  return (
    <Tag color={paymentStateMeta[s].color} style={{ marginInlineEnd: 0 }}>
      {paymentStateMeta[s].label}
    </Tag>
  );
}

// Ngày làm xong + nhắc hạn (Hôm nay / Ngày mai / Trễ n ngày)
export function ReadyDate({ order }: { order: Order }) {
  const d = deadline(order);
  return (
    <Flex vertical>
      <Typography.Text className="tabular">{dayjs(order.readyDate).format("DD/MM")}</Typography.Text>
      {d && (
        <Typography.Text type={d.tone} strong={d.tone !== "secondary"} style={{ fontSize: 12, whiteSpace: "nowrap" }}>
          {d.label}
        </Typography.Text>
      )}
    </Flex>
  );
}

// Ảnh sản phẩm; nến tự phối không có ảnh thì hiện icon
export function ItemThumb({ item, size = 40 }: { item: OrderItem; size?: number }) {
  return (
    <Avatar
      shape="square"
      size={size}
      src={item.image}
      icon={item.image ? undefined : <ExperimentOutlined />}
      alt=""
      style={{ borderRadius: 10, flexShrink: 0, background: brand.emberLight, color: brand.emberDark }}
    />
  );
}

export function ItemStack({ order }: { order: Order }) {
  const shown = order.items.slice(0, 3);
  return (
    <Avatar.Group max={{ count: 3 }} size={36}>
      {shown.map((i) => (
        <ItemThumb key={i.id} item={i} size={36} />
      ))}
    </Avatar.Group>
  );
}
