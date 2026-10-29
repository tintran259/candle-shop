import { Col, Flex, Row, Typography } from "antd";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SalesByType } from "@/components/dashboard/sales-by-type";
import { TopProducts } from "@/components/dashboard/top-products";
import { DashboardSkeleton } from "@/components/skeletons";
import { useOrders } from "@/hooks/use-orders";
import { useTitle } from "@/lib/use-title";

export function DashboardPage() {
  useTitle("Dashboard");
  // Đơn gần đây lấy từ kho đơn hàng — chờ tải xong mới hiện cả trang để bố cục không nhảy
  const { loading } = useOrders();
  if (loading) return <DashboardSkeleton />;
  return (
    <Flex vertical gap={16}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Xin chào, Admin 👋
        </Typography.Title>
        <Typography.Text type="secondary">Tình hình kinh doanh của 2510 Scented Candle trong 30 ngày qua.</Typography.Text>
      </div>

      <KpiCards />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <RevenueChart />
        </Col>
        <Col xs={24} xl={8}>
          <SalesByType />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <RecentOrders />
        </Col>
        <Col xs={24} xl={8}>
          <TopProducts />
        </Col>
      </Row>
    </Flex>
  );
}
