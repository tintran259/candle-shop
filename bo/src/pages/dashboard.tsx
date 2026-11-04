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
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { WorkshopSchedule } from "@/components/dashboard/workshop-schedule";
import { useSettings } from "@/hooks/use-settings";
import { useStockHold } from "@/hooks/use-stock-hold";
import { workshopSchedule } from "@/lib/capacity";
import { orderCost } from "@/lib/costs";
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
  const { label: categoryLabel } = useCategories();
  const { source } = useStockHold();
  const { settings } = useSettings();
  const stats = useMemo(() => dashboardStats(orders, products, categoryLabel, days, undefined, (o) => orderCost(o, source).cost), [orders, products, categoryLabel, days, source]);
  const schedule = useMemo(() => workshopSchedule(orders, settings.dailyCapacity), [orders, settings.dailyCapacity]);

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
          <Flex vertical gap={16}>
            <WorkshopSchedule rows={schedule} />
            <TopProducts rows={stats.top} days={days} />
          </Flex>
        </Col>
      </Row>
    </Flex>
  );
}
