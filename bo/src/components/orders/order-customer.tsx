import { CopyOutlined, EnvironmentOutlined, MailOutlined, MessageOutlined, PhoneOutlined } from "@ant-design/icons";
import { App, Avatar, Button, DatePicker, Divider, Flex, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { FormSection } from "@/components/form/form-section";
import type { OrdersApi } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import { canCancel, shippingLabels } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";
import { brand } from "@/theme";

const digits = (s: string) => s.replace(/\D/g, "");
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Flex gap={12} align="flex-start">
      <span aria-hidden style={{ color: "#6b6b6b", marginTop: 2 }}>
        {icon}
      </span>
      <Flex vertical style={{ minWidth: 0, flex: 1 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {label}
        </Typography.Text>
        {children}
      </Flex>
    </Flex>
  );
}

// Khách hàng: ai, liên hệ thế nào, đã mua bao nhiêu lần; rồi giao tới đâu, khi nào
export function CustomerSection({ order, api }: { order: Order; api: OrdersApi }) {
  const { message } = App.useApp();
  const { customer } = order;
  const phone = digits(customer.phone);

  // Lịch sử mua: các đơn cùng số điện thoại — bỏ đơn đã hủy, nhưng luôn tính đơn đang xem
  const history = api.orders.filter((o) => digits(o.customer.phone) === phone && (o.status !== "cancelled" || o.id === order.id));
  const spent = history.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const returning = history.length > 1;
  // Chỉ đổi ngày làm xong khi xưởng chưa làm xong
  const editable = canCancel(order.status) && order.status !== "ready";

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).then(
      () => message.success(`Đã sao chép ${what}`),
      () => message.error("Trình duyệt chặn sao chép"),
    );
  };

  return (
    <FormSection title="Khách hàng">
      <Flex gap={12} align="center">
        <Avatar size={48} style={{ background: brand.emberLight, color: brand.emberDark, fontWeight: 600, flexShrink: 0 }}>
          {initials(customer.name)}
        </Avatar>
        <Flex vertical gap={4} style={{ minWidth: 0 }}>
          <Typography.Text strong style={{ fontSize: 16 }}>
            {customer.name}
          </Typography.Text>
          <Flex gap={6} wrap align="center">
            <Tag color={returning ? "green" : "blue"} style={{ marginInlineEnd: 0 }}>
              {returning ? "Khách quen" : "Khách mới"}
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {history.length} đơn{spent ? ` · đã mua ${formatMoney(spent)}` : ""}
            </Typography.Text>
          </Flex>
        </Flex>
      </Flex>

      {/* Liên hệ nhanh — nút đủ lớn để bấm trên điện thoại */}
      <Flex gap={8} style={{ marginTop: 16 }}>
        <Button icon={<PhoneOutlined />} href={`tel:${phone}`} style={{ flex: 1 }}>
          Gọi
        </Button>
        <Button icon={<MessageOutlined />} href={`https://zalo.me/${phone}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
          Zalo
        </Button>
        <Button icon={<MailOutlined />} href={`mailto:${customer.email}?subject=${encodeURIComponent(`Đơn ${order.code}`)}`} style={{ flex: 1 }}>
          Email
        </Button>
      </Flex>

      <Flex vertical gap={14} style={{ marginTop: 16 }}>
        <InfoRow icon={<PhoneOutlined />} label="Số điện thoại">
          <Flex align="center" gap={4}>
            <Typography.Text strong className="tabular">
              {customer.phone}
            </Typography.Text>
            <Tooltip title="Sao chép số điện thoại">
              <Button type="text" size="small" icon={<CopyOutlined />} aria-label="Sao chép số điện thoại" onClick={() => copy(phone, "số điện thoại")} />
            </Tooltip>
          </Flex>
        </InfoRow>
        <InfoRow icon={<MailOutlined />} label="Email">
          <Typography.Text ellipsis>{customer.email}</Typography.Text>
        </InfoRow>
      </Flex>

      <Divider style={{ margin: "18px 0 14px" }} />
      <Typography.Text type="secondary" strong style={{ display: "block", fontSize: 12, marginBottom: 12, letterSpacing: "0.04em" }}>
        GIAO HÀNG
      </Typography.Text>
      <Flex vertical gap={14}>
        <InfoRow icon={<EnvironmentOutlined />} label="Địa chỉ nhận">
          <Typography.Text>{order.shippingAddress}</Typography.Text>
          <Flex gap={4} style={{ marginTop: 4 }}>
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(`${customer.name} – ${customer.phone} – ${order.shippingAddress}`, "thông tin giao hàng")}>
              Sao chép
            </Button>
            <Button
              size="small"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở bản đồ
            </Button>
          </Flex>
        </InfoRow>
        <Flex gap={16} wrap>
          <InfoRow icon={null} label="Hình thức">
            <Typography.Text>{shippingLabels[order.shippingMethod]}</Typography.Text>
          </InfoRow>
          <InfoRow icon={null} label="Ngày làm xong">
            {editable ? (
              <DatePicker
                aria-label="Ngày làm xong"
                format="DD/MM/YYYY"
                allowClear={false}
                size="small"
                value={dayjs(order.readyDate)}
                disabledDate={(d) => d.isBefore(dayjs(), "day")}
                onChange={(d) => {
                  if (!d) return;
                  api.reschedule(order.id, d.format("YYYY-MM-DD"));
                  message.success(`Đã đổi ngày làm xong sang ${d.format("DD/MM")} — nhớ báo khách.`);
                }}
                style={{ width: 140 }}
              />
            ) : (
              <Typography.Text>{dayjs(order.readyDate).format("DD/MM/YYYY")}</Typography.Text>
            )}
          </InfoRow>
        </Flex>
      </Flex>
    </FormSection>
  );
}
