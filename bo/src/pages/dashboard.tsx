import { Col, Flex, Row, Segmented, Typography } from "antd";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { AttentionCards } from "@/components/dashboard/attention-cards";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SalesByType } from "@/components/dashboard/sales-by-type";
import { TopProducts } from "@/components/dashboard/top-products";
import { DashboardSkeleton } from "@/components/skeletons";
import { useInventory } from "@/hooks/use-inventory";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { dashboardRanges, dashboardStats } from "@/lib/dashboard/stats";
import { useTitle } from "@/lib/use-title";

const DEFAULT_DAYS = 30;

export function DashboardPage() {
  useTitle("Dashboard");
  const { orders, loading } = useOrders();
  const { products, loading: l2 } = useProducts();
  const { loading: l3 } = useInventory();
  // Kỳ đang xem nằm trên URL: tải lại vẫn giữ, gửi link được
  const [params, setParams] = useSearchParams();
  const asked = Number(params.get("days"));
  const days = dashboardRanges.find((d) => d === asked) ?? DEFAULT_DAYS;
  const stats = useMemo(() => dashboardStats(orders, products, days), [orders, products, days]);

  // Chờ tải xong mới hiện cả trang để bố cục không nhảy
  if (loading || l2 || l3) return <DashboardSkeleton />;
  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" gap={16} wrap>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Xin chào, Admin 👋
          </Typography.Title>
          <Typography.Text type="secondary">Tình hình kinh doanh của 2510 Scented Candle trong {days} ngày qua.</Typography.Text>
        </div>
        <Segmented
          options={dashboardRanges.map((d) => ({ value: d, label: `${d} ngày` }))}
          value={days}
          onChange={(d) => setParams(d === DEFAULT_DAYS ? {} : { days: String(d) }, { replace: true })}
          aria-label="Khoảng thời gian"
        />
      </Flex>

      <AttentionCards />
      <KpiCards kpis={stats.kpis} days={days} />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <RevenueChart data={stats.daily} days={days} />
        </Col>
        <Col xs={24} xl={8}>
          <SalesByType rows={stats.byType} days={days} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <RecentOrders />
        </Col>
        <Col xs={24} xl={8}>
          <TopProducts rows={stats.top} days={days} />
        </Col>
      </Row>
    </Flex>
  );
}
