import { App, Button, Divider, Flex, Image, Input, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { useState } from "react";
import { FormSection } from "@/components/form/form-section";
import { ItemThumb } from "@/components/orders/order-view";
import { useInventory } from "@/hooks/use-inventory";
import { useStockHold } from "@/hooks/use-stock-hold";
import { orderCost } from "@/lib/costs";
import { orderProfit } from "@/lib/orders/money";
import { resolutionLabels } from "@/lib/orders/complaint";
import type { OrdersApi } from "@/hooks/use-orders";
import { unitLabel } from "@/lib/craft/groups";
import { formatMoney, formatNumber } from "@/lib/format";
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
  const { materials } = useInventory();
  const { source } = useStockHold();
  const cost = orderCost(order, source);
  // Lãi gồm phí vận chuyển shop chịu; đơn hủy tính trên tiền giữ lại (lib/orders/money)
  const result = orderProfit(order, cost.cost);
  const cancelled = order.status === "cancelled";
  const percent = result.value > 0 ? result.profit / result.value : null;
  const recipeText = (recipe: NonNullable<Order["items"][number]["recipe"]>) =>
    recipe
      .map((r) => {
        const m = materials.find((x) => x.id === r.materialId);
        return m ? `${m.name} ${formatNumber(r.quantity)} ${unitLabel[m.unit]}` : r.materialId;
      })
      .join(" · ");
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
              {i.recipe && i.recipe.length > 0 && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Công thức 1 hũ: {recipeText(i.recipe)}
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
      {(!cancelled || result.value > 0 || result.carrier > 0 || result.material > 0) && (
        <Flex vertical gap={6} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #eee5da" }} aria-label="Giá vốn và lãi gộp" role="group">
          {cancelled && <Row label="Tiền hàng giữ lại" value={formatMoney(result.value)} />}
          {(!cancelled || result.material > 0) && (
            <Flex justify="space-between">
              <Typography.Text type="secondary">
                Giá vốn nguyên liệu{" "}
                <Tooltip title={cost.final ? "Chốt theo giá nhập lúc Bắt đầu làm." : "Ước tính theo công thức và giá nhập hiện tại; chốt khi Bắt đầu làm."}>
                  <Tag style={{ marginInlineEnd: 0 }}>{cost.final ? "đã chốt" : "ước tính"}</Tag>
                </Tooltip>
              </Typography.Text>
              <Typography.Text className="tabular">{formatMoney(result.material)}</Typography.Text>
            </Flex>
          )}
          {order.shippingCost !== undefined && (
            <Flex justify="space-between">
              <Tooltip title="Phí vận chuyển khách trả là tiền thu hộ để trả bên vận chuyển, không phải doanh thu. Phần shop trả thêm thì trừ vào lãi.">
                <Typography.Text type="secondary">Phí trả đơn vị vận chuyển · khách trả {formatMoney(result.carrier + result.shipping)}</Typography.Text>
              </Tooltip>
              <Typography.Text className="tabular">{formatMoney(result.carrier)}</Typography.Text>
            </Flex>
          )}
          <Flex justify="space-between">
            <Typography.Text type="secondary">{cancelled ? "Lãi sau khi hủy" : "Lãi gộp"}</Typography.Text>
            <Typography.Text strong className="tabular" type={result.profit < 0 ? "danger" : undefined}>
              {formatMoney(result.profit)}
              {percent !== null && ` · ${Math.round(percent * 100)}%`}
            </Typography.Text>
          </Flex>
          {cost.missing.length > 0 && (
            <Typography.Text type="warning" style={{ fontSize: 12 }}>
              Chưa có giá nhập: {cost.missing.map((m) => m.name).join(", ")} — giá vốn đang thiếu phần này.
            </Typography.Text>
          )}
        </Flex>
      )}
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

// Khiếu nại sau khi giao: nội dung, ảnh khách gửi, cách xử lý, link đơn gửi bù
export function ComplaintsSection({ order }: { order: Order }) {
  if (!order.complaints?.length) return null;
  return (
    <FormSection title={`Khiếu nại (${order.complaints.length})`}>
      <Flex vertical gap={14}>
        {order.complaints.map((c) => (
          <Flex key={c.id} vertical gap={4}>
            <Flex justify="space-between" gap={8} wrap>
              <Typography.Text strong>{c.reason}</Typography.Text>
              <Tag color={c.resolution === "none" ? "default" : "volcano"} style={{ marginInlineEnd: 0 }}>
                {resolutionLabels[c.resolution]}
              </Tag>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(c.at).format("HH:mm DD/MM/YYYY")} · {c.by}
              {c.refundAmount ? ` · hoàn ${formatMoney(c.refundAmount)}` : ""}
              {c.replacementId && (
                <>
                  {" · gửi bù "}
                  <Link to={`/orders?order=${c.replacementId}`}>{c.replacementCode}</Link>
                </>
              )}
            </Typography.Text>
            {c.images.length > 0 && (
              <Flex gap={6} wrap>
                <Image.PreviewGroup>
                  {c.images.map((src, i) => (
                    <Image key={i} src={src} alt={`Ảnh khách gửi ${i + 1}`} width={56} height={56} style={{ objectFit: "cover", borderRadius: 8 }} />
                  ))}
                </Image.PreviewGroup>
              </Flex>
            )}
          </Flex>
        ))}
      </Flex>
    </FormSection>
  );
}
