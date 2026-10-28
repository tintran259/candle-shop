import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SalesByType } from "@/components/dashboard/sales-by-type";
import { TopProducts } from "@/components/dashboard/top-products";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-2xl font-semibold">Xin chào, Admin 👋</h2>
        <p className="text-sm text-muted-foreground">Tình hình kinh doanh của 2510 Scented Candle trong 30 ngày qua.</p>
      </div>

      <KpiCards />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <RevenueChart />
        <SalesByType />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <RecentOrders />
        <TopProducts />
      </div>
    </div>
  );
}
