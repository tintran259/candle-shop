import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Card, Col, Flex, Row, Typography } from "antd";
import { MoreLink } from "@/components/more-link";
import { formatMoney, formatMoneyShort, formatNumber, formatPercent } from "@/lib/format";
import { kpis } from "@/lib/mock";

const items = [
  { label: "Doanh thu", value: formatMoneyShort(kpis.revenue.value), delta: kpis.revenue.delta, link: { to: "/orders", label: "Báo cáo doanh thu" } },
  { label: "Đơn hàng", value: formatNumber(kpis.orders.value), delta: kpis.orders.delta, link: { to: "/orders", label: "Tất cả đơn" } },
  { label: "Giá trị đơn TB", value: formatMoney(Math.round(kpis.aov.value / 1000) * 1000), delta: kpis.aov.delta, link: { to: "/products", label: "Sản phẩm" } },
  { label: "Khách hàng mới", value: formatNumber(kpis.customers.value), delta: kpis.customers.delta, link: { to: "/customers", label: "Khách hàng" } },
];

// Mỗi thẻ: tiêu đề → số lớn nét mảnh + mũi tên xu hướng → mô tả → link ở đáy
export function KpiCards() {
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => {
        const up = item.delta >= 0;
        return (
          <Col key={item.label} xs={24} sm={12} xl={6}>
            <Card style={{ height: "100%" }}>
              <Flex vertical gap={8} style={{ height: "100%" }}>
                <Typography.Text strong style={{ fontSize: 17 }}>
                  {item.label}
                </Typography.Text>
                <Flex align="center" gap={10}>
                  <span className="big-number" style={{ fontSize: 40, lineHeight: 1.15 }}>
                    {item.value}
                  </span>
                  <Typography.Text type={up ? "success" : "danger"} style={{ fontSize: 20 }} aria-label={up ? "Tăng" : "Giảm"}>
                    {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  </Typography.Text>
                </Flex>
                <Typography.Text type="secondary">
                  <Typography.Text type={up ? "success" : "danger"} strong className="tabular">
                    {formatPercent(item.delta)}
                  </Typography.Text>{" "}
                  so với 30 ngày trước
                </Typography.Text>
                <div style={{ marginTop: "auto", paddingTop: 16 }}>
                  <MoreLink to={item.link.to}>{item.link.label}</MoreLink>
                </div>
              </Flex>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
