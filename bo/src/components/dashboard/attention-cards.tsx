import { Card, Col, Flex, Row, Typography } from "antd";
import { MoreLink } from "@/components/more-link";
import { useStockHold } from "@/hooks/use-stock-hold";
import { useOrders } from "@/hooks/use-orders";
import { attention } from "@/lib/dashboard/stats";
import { formatMoneyShort, formatNumber } from "@/lib/format";

// Việc cần xử lý ngay: có việc thì số đỏ, kèm link tới đúng danh sách
export function AttentionCards() {
  const { orders } = useOrders();
  const { held } = useStockHold();
  const a = attention(orders);
  const items = [
    { label: "Đơn trễ hạn", value: formatNumber(a.late), urgent: a.late > 0, to: "/orders?sort=ready-soon", link: "Xem đơn" },
    { label: "Giao lỗi cần xử lý", value: formatNumber(a.issues), urgent: a.issues > 0, to: `/orders?status=${a.issueStatus ?? "delivery_failed"}`, link: "Xem đơn" },
    {
      label: "Chờ hoàn tiền",
      value: formatMoneyShort(a.refundAmount),
      urgent: a.refundCount > 0,
      note: a.refundCount ? `${a.refundCount} đơn` : undefined,
      to: "/orders?payment=refunding",
      link: "Xem đơn",
    },
    { label: "Nguyên liệu đang giữ", value: formatNumber(held.size), urgent: false, note: held.size ? "Cho đơn đã thanh toán" : undefined, to: "/inventory", link: "Xem Kho" },
  ];
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.label} xs={12} xl={6}>
          <Card style={{ height: "100%" }}>
            <Flex vertical gap={4} style={{ height: "100%" }}>
              <Typography.Text type="secondary">{item.label}</Typography.Text>
              <Typography.Text strong type={item.urgent ? "danger" : undefined} className="tabular" style={{ fontSize: 24 }}>
                {item.value}
              </Typography.Text>
              {item.note && (
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {item.note}
                </Typography.Text>
              )}
              <div style={{ marginTop: "auto", paddingTop: 8 }}>
                <MoreLink to={item.to}>{item.link}</MoreLink>
              </div>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
