import { App, Button, Divider, Flex, Input, Tag, Typography } from "antd";
import { useState } from "react";
import { FormSection } from "@/components/form/form-section";
import { ItemThumb } from "@/components/orders/order-view";
import type { OrdersApi } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/orders/types";

type Props = { order: Order; api: OrdersApi };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Flex justify="space-between">
      <Typography.Text type={strong ? undefined : "secondary"} strong={strong}>
        {label}
      </Typography.Text>
      <Typography.Text strong={strong} className="tabular" style={strong ? { fontSize: 16 } : undefined}>
        {value}
      </Typography.Text>
    </Flex>
  );
}

export function ItemsSection({ order }: { order: Order }) {
  return (
    <FormSection title={`Sản phẩm (${order.items.length})`}>
      <Flex vertical gap={12}>
        {order.items.map((i) => (
          <Flex key={i.id} gap={12} align="flex-start">
            <ItemThumb item={i} size={52} />
            <Flex vertical style={{ flex: 1, minWidth: 0 }}>
              <Flex gap={6} align="center" wrap>
                <Typography.Text strong>{i.name}</Typography.Text>
                {i.custom && <Tag color="orange">Tự phối</Tag>}
              </Flex>
              {i.custom && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {i.custom}
                </Typography.Text>
              )}
              <Typography.Text type="secondary" className="tabular" style={{ fontSize: 13 }}>
                {formatMoney(i.price)} × {i.quantity}
              </Typography.Text>
            </Flex>
            <Typography.Text strong className="tabular">
              {formatMoney(i.price * i.quantity)}
            </Typography.Text>
          </Flex>
        ))}
      </Flex>
      <Divider style={{ margin: "16px 0 12px" }} />
      <Flex vertical gap={6}>
        <Row label="Tạm tính" value={formatMoney(order.subtotal)} />
        {order.discount > 0 && <Row label={`Giảm giá${order.discountCode ? ` (${order.discountCode})` : ""}`} value={`−${formatMoney(order.discount)}`} />}
        <Row label="Phí giao hàng" value={order.shippingFee ? formatMoney(order.shippingFee) : "Miễn phí"} />
        <Row label="Tổng cộng" value={formatMoney(order.total)} strong />
      </Flex>
    </FormSection>
  );
}

export function NotesSection({ order, api }: Props) {
  const { message } = App.useApp();
  const [draft, setDraft] = useState(order.internalNote ?? "");
  const changed = draft.trim() !== (order.internalNote ?? "");

  return (
    <FormSection title="Ghi chú">
      {order.note && (
        <div style={{ background: "#fbf1e8", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Khách ghi chú
          </Typography.Text>
          <div>{order.note}</div>
        </div>
      )}
      <Input.TextArea
        aria-label="Ghi chú nội bộ"
        placeholder="Ghi chú nội bộ — khách không thấy (vd: đã gọi xác nhận, gói quà màu kem…)"
        autoSize={{ minRows: 2, maxRows: 5 }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      {changed && (
        <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
          <Button size="small" onClick={() => setDraft(order.internalNote ?? "")}>
            Hủy
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              api.setInternalNote(order.id, draft);
              message.success("Đã lưu ghi chú");
            }}
          >
            Lưu ghi chú
          </Button>
        </Flex>
      )}
    </FormSection>
  );
}
