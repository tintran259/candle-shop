import { CheckCircleFilled, ClockCircleFilled, RollbackOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, Image, Progress, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState, type ReactNode } from "react";
import { FormSection } from "@/components/form/form-section";
import { RefundModal } from "@/components/orders/order-refund";
import type { OrdersApi } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import { depositLabel, faultLabels, overpaid, paidAmount, partialRefunds, providerLabels, remaining } from "@/lib/orders/labels";
import type { Order, Payment, PaymentStatus } from "@/lib/orders/types";
import { imageUrl } from "@/lib/craft/image";

const paymentStatus: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "gold" },
  success: { label: "Đã nhận", color: "green" },
  failed: { label: "Thất bại", color: "red" },
  refunded: { label: "Đã hoàn", color: "magenta" },
};

// Tên khoản thu dễ hiểu thay vì chỉ ghi cổng thanh toán
function paymentTitle(order: Order, p: Payment, index: number) {
  if (p.kind === "refund") return "Hoàn tiền cho khách";
  // Khoản đầu luôn là cọc / trả đủ lúc đặt — kể cả đơn tạo tại BO trả tiền mặt
  if (index === 0 && order.paymentPlan !== "later") return order.paymentPlan === "deposit" ? `Tiền ${depositLabel(order).toLowerCase()}` : "Thanh toán đủ";
  if (p.provider === "cod") return "Thu nốt khi giao";
  return "Thanh toán thêm";
}

// Giải thích phần còn phải thu: thu lúc nào, bằng cách nào
function remainingNote(order: Order, left: number) {
  if (order.status === "cancelled") {
    if (order.refund || order.payments.some((p) => p.status === "refunded")) return "Đơn đã hủy — đã hoàn tiền cho khách.";
    if (order.refundDue) return "Đơn đã hủy — chờ hoàn tiền cho khách.";
    return order.cancelFault === "customer" ? "Đơn đã hủy — giữ tiền cọc do lỗi từ khách." : "Đơn đã hủy — không thu thêm.";
  }
  if (overpaid(order)) return "Khách đã trả dư sau khi sửa đơn.";
  if (!left) return "Đã thu đủ, không cần thu thêm.";
  if (order.paymentPlan === "later" && !paidAmount(order)) return `Khách trả ${formatMoney(left)} khi nhận hàng — bấm Khách đã nhận là ghi nhận đã thu đủ.`;
  if (order.status === "pending") {
    const due = order.payments.find((p) => p.status === "pending")?.amount ?? left;
    const what = order.paymentPlan === "deposit" ? `cọc ${formatMoney(due)}` : formatMoney(due);
    return `Chờ khách thanh toán ${what} qua ${providerLabels[order.paymentMethod]}.`;
  }
  return "Bấm Khách đã nhận là ghi nhận đã thu đủ.";
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
  const [refunding, setRefunding] = useState<"cancel" | "overpaid" | null>(null);
  const paid = paidAmount(order);
  const extra = overpaid(order);
  // Hoàn khi hủy đơn thay ô Đã thu; hoàn một phần (thu dư, khiếu nại) ghi chú dưới ô Đã thu
  const refunded = order.payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, order.refund?.amount ?? 0);
  const partial = partialRefunds(order);
  const cancelled = order.status === "cancelled";
  const left = cancelled ? 0 : remaining(order);
  const percent = order.total ? Math.round((paid / order.total) * 100) : 0;
  const methods = [...new Set(order.payments.filter((p) => p.status === "success").map((p) => providerLabels[p.provider]))].join(" + ");

  return (
    <FormSection
      title="Thanh toán"
      description={`${order.paymentPlan === "deposit" ? `${depositLabel(order)} khi đặt, phần còn lại thu khi giao` : order.paymentPlan === "later" ? "Khách trả toàn bộ khi nhận hàng" : "Khách trả đủ khi đặt"} · ${providerLabels[order.paymentMethod]}`}
    >
      {/* Tiến độ thu tiền trên tổng đơn */}
      <Flex justify="space-between" align="baseline">
        <Typography.Text type="secondary">Tổng đơn</Typography.Text>
        <Typography.Text strong className="tabular" style={{ fontSize: 16 }}>
          {formatMoney(order.total)}
        </Typography.Text>
      </Flex>
      <Progress percent={cancelled ? 0 : percent} showInfo={false} strokeColor={left ? "#fa8c16" : "#52c41a"} aria-label={`Đã thu ${percent}% tổng đơn`} style={{ margin: "4px 0 2px" }} />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {cancelled ? "Đơn đã hủy" : `Đã thu ${percent}% tổng đơn`}
      </Typography.Text>

      <Flex gap={10} wrap style={{ marginTop: 14 }}>
        {refunded > 0 ? (
          <Figure label="Đã hoàn" value={refunded} note="Đã trả lại cho khách." tone="neutral" icon={<RollbackOutlined />} />
        ) : (
          <Figure
            label="Đã thu"
            value={paid}
            note={partial ? `Sau khi đã hoàn ${formatMoney(partial)}` : paid ? `Qua ${methods}` : "Chưa nhận khoản nào."}
            tone={paid ? "success" : "neutral"}
            icon={<CheckCircleFilled />}
          />
        )}
        <Figure
          label="Còn phải thu"
          value={left}
          note={remainingNote(order, left)}
          tone={left ? "warning" : cancelled ? "neutral" : "success"}
          icon={left ? <ClockCircleFilled /> : <CheckCircleFilled />}
        />
      </Flex>

      {order.refundDue && !order.refund && (
        <>
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            title={`Cần hoàn ${formatMoney(order.refundDue)} cho khách`}
            description={`${order.cancelFault ? `${faultLabels[order.cancelFault]}. ` : ""}Hoàn xong thì ghi nhận kèm ảnh chứng từ.`}
          />
          <Button type="primary" icon={<RollbackOutlined />} block style={{ marginTop: 12 }} onClick={() => setRefunding("cancel")}>
            Ghi nhận đã hoàn tiền
          </Button>
        </>
      )}

      {extra > 0 && (
        <>
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            title={`Thu dư ${formatMoney(extra)}, cần hoàn cho khách`}
            description="Tổng đơn giảm sau khi sửa đơn. Hoàn xong thì ghi nhận kèm ảnh chứng từ."
          />
          <Button type="primary" icon={<RollbackOutlined />} block style={{ marginTop: 12 }} onClick={() => setRefunding("overpaid")}>
            Ghi nhận đã hoàn phần dư
          </Button>
        </>
      )}
      <RefundModal key={refunding ?? "closed"} open={!!refunding} order={order} api={api} overpaid={refunding === "overpaid"} onClose={() => setRefunding(null)} />

      {order.refund && (
        <Flex vertical gap={8} style={{ marginTop: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Hoàn lúc {dayjs(order.refund.at).format("HH:mm DD/MM")} · {order.refund.by}
            {order.refund.note && ` · ${order.refund.note}`}
          </Typography.Text>
          <Flex gap={8} wrap>
            <Image.PreviewGroup>
              {order.refund.images.map((src, i) => (
                <Image key={i} src={imageUrl(src, 64)} preview={{ src }} alt={`Ảnh chứng từ ${i + 1}`} width={64} height={64} style={{ objectFit: "cover", borderRadius: 8 }} />
              ))}
            </Image.PreviewGroup>
          </Flex>
        </Flex>
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
                {p.kind === "refund" ? "Hoàn" : providerLabels[p.provider]} · {dayjs(p.createdAt).format("HH:mm DD/MM")}
                {p.transactionId && ` · Mã GD ${p.transactionId}`}
                {p.note && ` · ${p.note}`}
              </Typography.Text>
              {!!p.images?.length && (
                <Flex gap={6} wrap style={{ marginTop: 6 }}>
                  <Image.PreviewGroup>
                    {p.images.map((src, k) => (
                      <Image key={k} src={imageUrl(src, 48)} preview={{ src }} alt={`Ảnh chứng từ ${k + 1}`} width={48} height={48} style={{ objectFit: "cover", borderRadius: 6 }} />
                    ))}
                  </Image.PreviewGroup>
                </Flex>
              )}
            </Flex>
            <Flex vertical align="flex-end" gap={2}>
              <Typography.Text strong className="tabular">
                {formatMoney(p.amount)}
              </Typography.Text>
              <Tag color={p.kind === "refund" ? "magenta" : paymentStatus[p.status].color} style={{ marginInlineEnd: 0 }}>
                {p.kind === "refund" ? "Đã hoàn" : paymentStatus[p.status].label}
              </Tag>
            </Flex>
          </Flex>
        ))}
      </Flex>
    </FormSection>
  );
}
