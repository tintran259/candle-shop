import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Card, Col, Flex, Row, Typography } from "antd";
import { MoreLink } from "@/components/more-link";
import type { DashboardStats } from "@/lib/dashboard/stats";
import { formatMoneyShort, formatNumber, formatPercent } from "@/lib/format";

// Mỗi thẻ: tiêu đề → số lớn nét mảnh + mũi tên xu hướng → mô tả → link ở đáy
export function KpiCards({ kpis, days }: { kpis: DashboardStats["kpis"]; days: number }) {
  const items = [
    // Doanh thu = tiền hàng của đơn đã chốt (hoàn tất, đơn hủy giữ cọc), không gồm phí vận chuyển (docs/pages/dashboard.md#quy-tắc-doanh-thu)
    {
      label: "Doanh thu",
      value: formatMoneyShort(kpis.revenue.value),
      delta: kpis.revenue.delta,
      note: [
        "Tiền hàng của đơn hoàn tất và tiền giữ lại của đơn hủy, không gồm phí vận chuyển",
        kpis.revenue.pending.count > 0 && `Chưa tính ${formatMoneyShort(kpis.revenue.pending.amount)} đã thu của ${formatNumber(kpis.revenue.pending.count)} đơn chưa hoàn tất`,
      ]
        .filter(Boolean)
        .join(" · "),
      link: { to: "/orders", label: "Tất cả đơn" },
    },
    { label: "Đơn hàng", value: formatNumber(kpis.orders.value), delta: kpis.orders.delta, link: { to: "/orders", label: "Tất cả đơn" } },
    // Tiền hàng trung bình của đơn Hoàn tất trong kỳ, không gồm phí vận chuyển
    {
      label: "Giá trị đơn TB",
      value: formatMoneyShort(kpis.average.value),
      delta: kpis.average.delta,
      note: `Tiền hàng TB của ${formatNumber(kpis.average.completed)} đơn hoàn tất, không gồm phí vận chuyển`,
      link: { to: "/orders?status=completed", label: "Đơn hoàn tất" },
    },
    { label: "Khách hàng mới", value: formatNumber(kpis.customers.value), delta: kpis.customers.delta, link: { to: "/customers", label: "Khách hàng" } },
    // Lãi gộp = giá trị hàng − giá vốn nguyên liệu − phí vận chuyển shop chịu, theo đơn đã chốt trong kỳ: Hoàn tất và đơn hủy (docs/pages/dashboard.md)
    {
      label: "Lãi gộp",
      value: formatMoneyShort(kpis.profit.value),
      delta: kpis.profit.delta,
      note: [
        `Từ ${formatNumber(kpis.profit.closed)} đơn đã chốt (hoàn tất, đã hủy)`,
        kpis.profit.rate !== null && `tỉ lệ lãi ${Math.round(kpis.profit.rate * 100)}%`,
        kpis.profit.shipping < 0 && `Đã trừ ${formatMoneyShort(-kpis.profit.shipping)} phí vận chuyển shop chịu`,
      ]
        .filter(Boolean)
        .join(" · "),
      link: { to: "/inventory", label: "Giá nhập ở Kho" },
    },
  ];
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => {
        const up = (item.delta ?? 0) >= 0;
        return (
          <Col key={item.label} xs={24} sm={12} flex="1 1 220px">
            <Card style={{ height: "100%" }}>
              <Flex vertical gap={8} style={{ height: "100%" }}>
                <Typography.Text strong style={{ fontSize: 17 }}>
                  {item.label}
                </Typography.Text>
                <Flex align="center" gap={10}>
                  <span className="big-number" style={{ fontSize: 40, lineHeight: 1.15 }}>
                    {item.value}
                  </span>
                  {item.delta !== null && item.delta !== 0 && (
                    <Typography.Text type={up ? "success" : "danger"} style={{ fontSize: 20 }} aria-label={up ? "Tăng" : "Giảm"}>
                      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    </Typography.Text>
                  )}
                </Flex>
                {item.delta === null ? (
                  <Typography.Text type="secondary">{days} ngày trước chưa có số để so sánh</Typography.Text>
                ) : (
                  <Typography.Text type="secondary">
                    <Typography.Text type={up ? "success" : "danger"} strong className="tabular">
                      {formatPercent(item.delta)}
                    </Typography.Text>{" "}
                    so với {days} ngày trước
                  </Typography.Text>
                )}
                {"note" in item && item.note && (
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {item.note}
                  </Typography.Text>
                )}
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
