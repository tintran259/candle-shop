import { CheckCircleFilled, ClockCircleFilled, CheckCircleOutlined, RollbackOutlined } from "@ant-design/icons";
import { App, Button, Flex, Progress, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { FormSection } from "@/components/form/form-section";
import type { OrdersApi } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import { paidAmount, providerLabels, remaining } from "@/lib/orders/labels";
import type { Order, Payment, PaymentStatus } from "@/lib/orders/types";

const paymentStatus: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "gold" },
  success: { label: "Đã nhận", color: "green" },
  failed: { label: "Thất bại", color: "red" },
  refunded: { label: "Đã hoàn", color: "magenta" },
};

// Tên khoản thu dễ hiểu thay vì chỉ ghi cổng thanh toán
function paymentTitle(order: Order, p: Payment, index: number) {
  // Khoản đầu luôn là cọc / trả đủ lúc đặt — kể cả đơn tạo tại BO trả tiền mặt
  if (index === 0) return order.paymentPlan === "deposit" ? "Tiền cọc 50%" : "Thanh toán đủ";
  if (p.provider === "cod") return "Thu nốt khi giao";
  return "Thanh toán thêm";
}

// Giải thích phần còn phải thu: thu lúc nào, bằng cách nào
function remainingNote(order: Order, left: number) {
  if (order.status === "cancelled") {
    return order.payments.some((p) => p.status === "refunded") ? "Đơn đã hủy — đã hoàn tiền cho khách." : "Đơn đã hủy — không thu thêm.";
  }
  if (!left) return "Đã thu đủ, không cần thu thêm.";
  if (order.status === "pending") {
    const due = order.payments.find((p) => p.status === "pending")?.amount ?? left;
    const what = order.paymentPlan === "deposit" ? `cọc ${formatMoney(due)}` : formatMoney(due);
    return `Chờ khách thanh toán ${what} qua ${providerLabels[order.paymentMethod]}.`;
  }
  return "Thu tiền mặt / chuyển khoản khi giao hàng.";
}

function Figure({ label, value, note, tone, icon }: { label: string; value: number; note: string; tone: "success" | "warning" | "neutral"; icon: ReactNode }) {
  const palette = {
    success: { bg: "#f0f9eb", fg: "#237804" },
    warning: { bg: "#fff7e6", fg: "#ad4e00" },
    neutral: { bg: "#f6f6f3", fg: "#454545" },
  }[tone];
  return (
    <Flex vertical gap={4} style={{ flex: 1, minWidth: 0, background: palette.bg, borderRadius: 14, padding: "12px 14px" }}>
      <Typography.Text style={{ fontSize: 13, color: palette.fg, fontWeight: 500 }}>
        {icon} {label}
      </Typography.Text>
      <span className="big-number" style={{ fontSize: 22, lineHeight: 1.2 }}>
        {formatMoney(value)}
      </span>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {note}
      </Typography.Text>
    </Flex>
  );
}

export function PaymentSection({ order, api }: { order: Order; api: OrdersApi }) {
  const { message } = App.useApp();
  const paid = paidAmount(order);
  const refunded = order.payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0);
  const cancelled = order.status === "cancelled";
  const left = cancelled ? 0 : remaining(order);
  const percent = order.total ? Math.round((paid / order.total) * 100) : 0;
  const canCollect = left > 0 && order.status !== "pending";
  const methods = [...new Set(order.payments.filter((p) => p.status === "success").map((p) => providerLabels[p.provider]))].join(" + ");

  return (
    <FormSection title="Thanh toán" description={`${order.paymentPlan === "deposit" ? "Cọc 50% khi đặt, phần còn lại thu khi giao" : "Khách trả đủ khi đặt"} · ${providerLabels[order.paymentMethod]}`}>
      {/* Tiến độ thu tiền trên tổng đơn */}
      <Flex justify="space-between" align="baseline">
        <Typography.Text type="secondary">Tổng đơn</Typography.Text>
        <Typography.Text strong className="tabular" style={{ fontSize: 16 }}>
          {formatMoney(order.total)}
        </Typography.Text>
      </Flex>
      <Progress
        percent={cancelled ? 0 : percent}
        showInfo={false}
        strokeColor={left ? "#fa8c16" : "#52c41a"}
        aria-label={`Đã thu ${percent}% tổng đơn`}
        style={{ margin: "4px 0 2px" }}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {cancelled ? "Đơn đã hủy" : `Đã thu ${percent}% tổng đơn`}
      </Typography.Text>

      <Flex gap={10} wrap style={{ marginTop: 14 }}>
        {refunded > 0 ? (
          <Figure label="Đã hoàn" value={refunded} note="Đã trả lại cho khách." tone="neutral" icon={<RollbackOutlined />} />
        ) : (
          <Figure label="Đã thu" value={paid} note={paid ? `Qua ${methods}` : "Chưa nhận khoản nào."} tone={paid ? "success" : "neutral"} icon={<CheckCircleFilled />} />
        )}
        <Figure
          label="Còn phải thu"
          value={left}
          note={remainingNote(order, left)}
          tone={left ? "warning" : cancelled ? "neutral" : "success"}
          icon={left ? <ClockCircleFilled /> : <CheckCircleFilled />}
        />
      </Flex>

      {canCollect && (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          block
          style={{ marginTop: 12 }}
          onClick={() => {
            api.collectRemaining(order.id);
            message.success(`Đã ghi nhận thu ${formatMoney(left)}`);
          }}
        >
          Đã thu {formatMoney(left)} khi giao
        </Button>
      )}

      <Typography.Text type="secondary" strong style={{ display: "block", fontSize: 12, margin: "18px 0 8px", letterSpacing: "0.04em" }}>
        CÁC KHOẢN THU
      </Typography.Text>
      <Flex vertical gap={10}>
        {order.payments.map((p, i) => (
          <Flex key={p.id} justify="space-between" align="flex-start" gap={12}>
            <Flex vertical style={{ minWidth: 0 }}>
              <Typography.Text strong>{paymentTitle(order, p, i)}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {providerLabels[p.provider]} · {dayjs(p.createdAt).format("HH:mm DD/MM")}
                {p.transactionId && ` · Mã GD ${p.transactionId}`}
              </Typography.Text>
            </Flex>
            <Flex vertical align="flex-end" gap={2}>
              <Typography.Text strong className="tabular">
                {formatMoney(p.amount)}
              </Typography.Text>
              <Tag color={paymentStatus[p.status].color} style={{ marginInlineEnd: 0 }}>
                {paymentStatus[p.status].label}
              </Tag>
            </Flex>
          </Flex>
        ))}
      </Flex>
    </FormSection>
  );
}
