import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Flex, Popconfirm, Row, Statistic, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { CustomerDrawer } from "@/components/customers/customer-drawer";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerToolbar } from "@/components/customers/customer-toolbar";
import { CustomersSkeleton } from "@/components/skeletons";
import { useCustomers } from "@/hooks/use-customers";
import { useOrders } from "@/hooks/use-orders";
import { applyCustomerFilters, defaultCustomerFilters, exportCustomersCsv, type CustomerFilters } from "@/lib/customers/filters";
import { customerStats, groupOrdersByPhone, type CustomerRow } from "@/lib/customers/stats";
import { formatMoneyShort, formatNumber } from "@/lib/format";
import { useDrawerTarget, useOpenParam } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

// Danh sách khách: hồ sơ (tài khoản hoặc khách vãng lai) + số liệu mua hàng tính từ đơn
export function CustomersPage() {
  useTitle("Khách hàng");
  const api = useCustomers();
  const { orders, loading: ordersLoading } = useOrders();
  const loading = api.loading || ordersLoading;
  const [filters, setFiltersState] = useState<CustomerFilters>(defaultCustomerFilters);

  // Gộp đơn theo số điện thoại một lần rồi tính số liệu từng khách
  const rows = useMemo<CustomerRow[]>(() => {
    const byPhone = groupOrdersByPhone(orders);
    return api.customers.map((customer) => ({ customer, stats: customerStats(customer, byPhone) }));
  }, [api.customers, orders]);
  // Memo để bảng (memo) chỉ render lại khi dữ liệu/bộ lọc/trang đổi — không phải khi mở drawer
  const items = useMemo(() => applyCustomerFilters(rows, filters), [rows, filters]);
  const pager = usePageQuery(loading ? undefined : items.length);
  const { paginationProps, resetPage } = pager;
  const pagination = useMemo(() => paginationProps(items.length, "khách"), [paginationProps, items.length]);
  const setFilters = (f: CustomerFilters) => {
    setFiltersState(f);
    resetPage();
  };

  // Hồ sơ đang mở nằm trên URL (?customer=id) — tìm kiếm, drawer đơn hàng link thẳng tới
  const [openId, setOpenId] = useOpenParam("customer");
  const { shown } = useDrawerTarget(openId);
  const drawer = (
    <CustomerDrawer open={!!openId} row={rows.find((r) => r.customer.id === shown)} api={api} loading={loading} onClose={() => setOpenId(null)} />
  );

  if (loading)
    return (
      <>
        <CustomersSkeleton />
        {drawer}
      </>
    );

  const buyers = rows.filter((r) => r.stats.orderCount > 0);
  const count = (s: CustomerFilters["segment"]) =>
    s === "all" ? rows.length : s === "blocked" ? rows.filter((r) => r.customer.blocked).length : rows.filter((r) => r.stats.segment === s).length;
  const newIn30 = rows.filter((r) => dayjs().diff(dayjs(r.customer.createdAt), "day") <= 30).length;
  const returning = buyers.filter((r) => r.stats.orderCount > 1).length;
  const spentTotal = buyers.reduce((s, r) => s + r.stats.spent, 0);
  const tags = [...new Set(rows.flatMap((r) => r.customer.tags))].sort((a, b) => a.localeCompare(b, "vi"));

  const stats = [
    { label: "Khách hàng", value: formatNumber(rows.length), note: `+${newIn30} trong 30 ngày` },
    {
      label: "Tỷ lệ quay lại",
      value: buyers.length ? `${Math.round((returning / buyers.length) * 100)}%` : "—",
      note: `${returning}/${buyers.length} khách mua lại`,
    },
    { label: "Chi tiêu TB / khách", value: buyers.length ? formatMoneyShort(spentTotal / buyers.length) : "—", note: "Khách đã mua hàng" },
    { label: "Lâu chưa mua", value: formatNumber(count("at-risk")), note: "Nên gửi ưu đãi", warn: count("at-risk") > 0 },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Khách hàng
          </Typography.Title>
          <Typography.Text type="secondary">Khách có tài khoản và khách đặt không đăng nhập, gộp theo số điện thoại.</Typography.Text>
        </div>
        <Flex gap={8}>
          <Popconfirm title="Khôi phục dữ liệu mẫu?" description="Nhãn, ghi chú và trạng thái chặn trên trình duyệt này sẽ mất." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
            <Button icon={<ReloadOutlined />}>Dữ liệu mẫu</Button>
          </Popconfirm>
          <Button icon={<DownloadOutlined />} disabled={!items.length} onClick={() => exportCustomersCsv(items)}>
            Xuất CSV
          </Button>
        </Flex>
      </Flex>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card style={{ height: "100%" }}>
              <Statistic title={s.label} value={s.value} />
              <Typography.Text type={s.warn ? "warning" : "secondary"} strong={s.warn} style={{ fontSize: 13 }}>
                {s.note}
              </Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card styles={{ body: { padding: 16 } }}>
        <CustomerToolbar filters={filters} onChange={setFilters} count={count} tags={tags} />
      </Card>

      <Card styles={{ body: { padding: 12 } }}>
        {items.length ? (
          <CustomerTable items={items} onOpen={setOpenId} pagination={pagination} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có khách khớp bộ lọc.">
            <Button onClick={() => setFilters(defaultCustomerFilters)}>Xóa bộ lọc</Button>
          </Empty>
        )}
      </Card>

      {drawer}
    </Flex>
  );
}
