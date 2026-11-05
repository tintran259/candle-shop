import { Alert, Flex, Tag, Typography } from "antd";
import { unitLabel } from "@/lib/craft/groups";
import { belowCost, type PriceCheck } from "@/lib/craft/pricing";
import { formatMoney, formatNumber } from "@/lib/format";
import { lineTotal, type DiscountResult, type DraftLine, type OrderTotals } from "@/lib/orders/create";
import { statusMeta } from "@/lib/orders/labels";
import type { shortages } from "@/lib/orders/materials";
import type { Order } from "@/lib/orders/types";

type Props = {
  lines: DraftLine[];
  totals: OrderTotals;
  discount: DiscountResult;
  // Sửa đơn: hiện đã thu / còn phải thu thay vì cọc
  order?: Order;
  lockItems: boolean;
  paid: number;
  paymentPlan?: Order["paymentPlan"];
  received?: boolean;
  depositPercent: number;
  minMargin: number;
  goods: PriceCheck;
  goodsWarning: boolean;
  shortage: ReturnType<typeof shortages>;
};

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="space-between" style={{ padding: "3px 0" }}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text className="tabular">{value}</Typography.Text>
    </Flex>
  );
}

// Tóm tắt đơn: các dòng, tiền, cọc / đã thu, cảnh báo đơn lỗ và thiếu Kho. Màn rộng dính bên phải form
export function OrderSummary({ lines, totals, discount, order, lockItems, paid, paymentPlan, received, depositPercent, minMargin, goods, goodsWarning, shortage }: Props) {
  const editing = !!order;
  return (
    <aside className="order-summary" aria-label="Tóm tắt đơn">
      <Typography.Title level={5} style={{ margin: 0 }}>
        Tóm tắt đơn
      </Typography.Title>
      {lines.length ? (
        <Flex vertical gap={6} style={{ margin: "12px 0" }} role="list">
          {lines.map((l, i) => (
            <Flex key={i} role="listitem" justify="space-between" gap={12} style={{ fontSize: 13 }}>
              <Typography.Text ellipsis style={{ fontSize: 13, minWidth: 0 }}>
                {l.kind === "custom" ? "Nến tự phối" : (l.name ?? "Chưa chọn sản phẩm")} × {l.quantity ?? 0}
              </Typography.Text>
              <Typography.Text className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                {formatMoney(lineTotal(l))}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Typography.Paragraph type="secondary" style={{ margin: "12px 0", fontSize: 13 }}>
          Chưa có sản phẩm.
        </Typography.Paragraph>
      )}
      <div className="order-summary-rows">
        <Line label="Tạm tính" value={formatMoney(totals.subtotal)} />
        <Line
          label={discount.discount ? `Giảm giá (${discount.discount.code})` : lockItems && order?.discountCode ? `Giảm giá (${order.discountCode})` : "Giảm giá"}
          value={totals.discount ? `−${formatMoney(totals.discount)}` : "—"}
        />
        <Line label="Phí giao" value={totals.shippingFee ? formatMoney(totals.shippingFee) : "Miễn phí"} />
        <Flex justify="space-between" align="baseline" style={{ padding: "8px 0 4px", borderTop: "1px solid #eee5da", marginTop: 6 }}>
          <Typography.Text strong>Tổng</Typography.Text>
          <Typography.Text strong className="tabular" style={{ fontSize: 20 }}>
            {formatMoney(totals.total)}
          </Typography.Text>
        </Flex>
        {editing ? (
          <>
            <Line label="Đã thu" value={formatMoney(paid)} />
            {paid > totals.total ? (
              <Flex justify="space-between" style={{ padding: "3px 0" }}>
                <Typography.Text type="warning">Thu dư, cần hoàn</Typography.Text>
                <Typography.Text type="warning" strong className="tabular">
                  {formatMoney(paid - totals.total)}
                </Typography.Text>
              </Flex>
            ) : (
              <Line label="Còn phải thu" value={formatMoney(totals.total - paid)} />
            )}
          </>
        ) : (
          <>
            <Line label={paymentPlan === "full" ? "Thu khi đặt" : `Cọc ${depositPercent}% tiền hàng khi đặt`} value={formatMoney(totals.dueNow)} />
            {totals.total > totals.dueNow && <Line label="Thu nốt khi giao" value={formatMoney(totals.total - totals.dueNow)} />}
          </>
        )}
      </div>
      {!editing && (
        <Flex align="center" gap={8} style={{ marginTop: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Trạng thái khi tạo:
          </Typography.Text>
          <Tag color={statusMeta[received ? "paid" : "pending"].color} style={{ marginInlineEnd: 0 }}>
            {statusMeta[received ? "paid" : "pending"].label}
          </Tag>
        </Flex>
      )}
      {goodsWarning && (
        <Alert
          type={belowCost(goods) ? "error" : "warning"}
          showIcon
          style={{ marginTop: 12 }}
          title={belowCost(goods) ? `Đơn lỗ ${formatMoney(goods.floor - goods.price)}` : `Lãi chỉ ${Math.round((goods.margin ?? 0) * 100)}%`}
          description={`Tiền hàng sau giảm giá ${formatMoney(goods.price)}, giá vốn nguyên liệu ${formatMoney(goods.floor)} (lãi tối thiểu ở Cài đặt: ${minMargin}%). Vẫn tạo được đơn.`}
        />
      )}
      {shortage.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 12 }}
          title="Kho không đủ nguyên liệu"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {shortage.map(({ m, need }) => (
                <li key={m.id}>
                  {m.name}: cần {formatNumber(need)}, còn {formatNumber(m.stock)} {unitLabel[m.unit]}
                </li>
              ))}
            </ul>
          }
        />
      )}
    </aside>
  );
}
