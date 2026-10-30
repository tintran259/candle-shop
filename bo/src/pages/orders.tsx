import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Flex, Popconfirm, Row, Statistic, Tabs, Typography } from "antd";
import { useMemo, useState } from "react";
import { OrderDrawer } from "@/components/orders/order-drawer";
import { OrderTable } from "@/components/orders/order-table";
import { OrderToolbar } from "@/components/orders/order-toolbar";
import { OrdersSkeleton } from "@/components/skeletons";
import { useOrders } from "@/hooks/use-orders";
import { formatMoneyShort } from "@/lib/format";
import { applyOrderFilters, defaultOrderFilters, type OrderFilters } from "@/lib/orders/filters";
import { deadline, remaining, statusMeta } from "@/lib/orders/labels";
import { orderFlow, type OrderStatus } from "@/lib/orders/types";
import { useDrawerTarget, useOpenParam } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

const tabs: (OrderStatus | "all")[] = ["all", ...orderFlow, "cancelled"];

// Quản lý đơn hàng làm theo đơn: thanh toán → làm → giao
export function OrdersPage() {
  useTitle("Đơn hàng");
  const api = useOrders();
  const { orders } = api;
  const [filters, setFiltersState] = useState<OrderFilters>(defaultOrderFilters);
  // Memo để bảng (memo) chỉ render lại khi dữ liệu/bộ lọc/trang đổi — không phải khi mở drawer
  const items = useMemo(() => applyOrderFilters(orders, filters), [orders, filters]);
  const pager = usePageQuery(api.loading ? undefined : items.length);
  const { paginationProps } = pager;
  const pagination = useMemo(() => paginationProps(items.length, "đơn"), [paginationProps, items.length]);
  // Đổi bộ lọc thì quay về trang 1
  const setFilters = (f: OrderFilters) => {
    setFiltersState(f);
    pager.resetPage();
  };
  // Đơn đang mở nằm trên URL (?order=id) — Dashboard, tìm kiếm, thông báo link thẳng tới
  const [openId, setOpenId] = useOpenParam("order");
  // Đóng drawer thì URL bỏ ?order= ngay — giữ đơn vừa xem để drawer trượt ra vẫn đúng nội dung
  const { shown: shownId } = useDrawerTarget(openId);

  const count = (s: OrderStatus | "all") => (s === "all" ? orders.length : orders.filter((o) => o.status === s).length);
  const late = orders.filter((o) => deadline(o)?.tone === "danger").length;
  const toCollect = orders.filter((o) => !["pending", "cancelled"].includes(o.status)).reduce((s, o) => s + remaining(o), 0);

  const drawer = <OrderDrawer open={!!openId} order={orders.find((o) => o.id === shownId)} api={api} onClose={() => setOpenId(null)} />;

  if (api.loading)
    return (
      <>
        <OrdersSkeleton />
        {drawer}
      </>
    );

  const stats = [
    { label: "Chờ thanh toán", value: count("pending") },
    { label: "Cần làm", value: count("paid") + count("producing"), note: late ? `${late} đơn trễ hạn` : undefined },
    { label: "Chờ giao", value: count("ready") },
    { label: "Còn phải thu", value: formatMoneyShort(toCollect) },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Đơn hàng
          </Typography.Title>
          <Typography.Text type="secondary">Theo dõi từ lúc khách thanh toán, xưởng làm (2–3 ngày) tới khi giao xong.</Typography.Text>
        </div>
        <Popconfirm title="Khôi phục dữ liệu mẫu?" description="Các thay đổi trên trình duyệt này sẽ mất." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
          <Button icon={<ReloadOutlined />}>Dữ liệu mẫu</Button>
        </Popconfirm>
      </Flex>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card style={{ height: "100%" }}>
              <Statistic title={s.label} value={s.value} />
              {s.note && (
                <Typography.Text type="danger" strong style={{ fontSize: 13 }}>
                  {s.note}
                </Typography.Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Card styles={{ body: { padding: "4px 16px 16px" } }}>
        <Tabs
          activeKey={filters.status}
          onChange={(k) => setFilters({ ...filters, status: k as OrderFilters["status"] })}
          items={tabs.map((s) => ({
            key: s,
            label: `${s === "all" ? "Tất cả" : statusMeta[s].label} · ${count(s)}`,
          }))}
        />
        <OrderToolbar filters={filters} onChange={setFilters} />
      </Card>

      <Card styles={{ body: { padding: 12 } }}>
        {items.length ? (
          <OrderTable items={items} onOpen={setOpenId} pagination={pagination} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có đơn hàng khớp bộ lọc.">
            <Button onClick={() => setFilters(defaultOrderFilters)}>Xóa bộ lọc</Button>
          </Empty>
        )}
      </Card>

      {drawer}
    </Flex>
  );
}
