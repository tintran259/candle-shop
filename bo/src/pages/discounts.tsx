import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Flex, Input, Popconfirm, Row, Segmented, Select, Statistic, Typography } from "antd";
import { useState } from "react";
import { DiscountDrawer } from "@/components/discounts/discount-drawer";
import { DiscountTable } from "@/components/discounts/discount-table";
import { ListPageSkeleton } from "@/components/skeletons";
import { useDiscounts } from "@/hooks/use-discounts";
import { useOrders } from "@/hooks/use-orders";
import { discountStatus, normalizeCode, periodHint, statusMeta, type DiscountStatus } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { formatMoneyShort, formatNumber } from "@/lib/format";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

type Filters = { q: string; status: DiscountStatus | "all"; sort: "newest" | "ending" | "most-used" };
const defaultFilters: Filters = { q: "", status: "all", sort: "newest" };
const statusOrder: (DiscountStatus | "all")[] = ["all", "running", "scheduled", "exhausted", "expired", "paused"];

function applyFilters(list: Discount[], f: Filters) {
  const q = normalizeCode(f.q);
  return list
    .filter((d) => f.status === "all" || discountStatus(d) === f.status)
    .filter((d) => !q || d.code.includes(q) || normalizeCode(d.description ?? "").includes(q))
    .sort((a, b) => {
      if (f.sort === "most-used") return b.used - a.used;
      // Sắp hết hạn: mã có ngày kết thúc gần nhất lên trước, mã không hết hạn xuống cuối
      if (f.sort === "ending") return (a.endsAt ?? "9999").localeCompare(b.endsAt ?? "9999");
      return b.createdAt.localeCompare(a.createdAt);
    });
}

// Quản lý mã giảm giá khách dùng ở bước thanh toán
export function DiscountsPage() {
  useTitle("Mã giảm giá");
  const api = useDiscounts();
  const { orders, loading: ordersLoading } = useOrders();
  const [filters, setFiltersState] = useState<Filters>(defaultFilters);
  // null = đóng, "new" = tạo mới, còn lại là id đang sửa
  const [editing, setEditing] = useState<string | null>(null);
  const items = applyFilters(api.discounts, filters);
  const pager = usePageQuery(api.loading ? undefined : items.length);
  const setFilters = (f: Filters) => {
    setFiltersState(f);
    pager.resetPage();
  };

  if (api.loading || ordersLoading) return <ListPageSkeleton label="Đang tải mã giảm giá…" />;

  const { discounts } = api;
  const count = (s: DiscountStatus | "all") => (s === "all" ? discounts.length : discounts.filter((d) => discountStatus(d) === s).length);
  const endingSoon = discounts.filter((d) => periodHint(d)?.urgent).length;
  const saved = orders.filter((o) => o.discountCode && o.status !== "cancelled").reduce((s, o) => s + o.discount, 0);
  const current = editing && editing !== "new" ? discounts.find((d) => d.id === editing) : undefined;

  const stats = [
    { label: "Đang chạy", value: formatNumber(count("running")), note: endingSoon ? `${endingSoon} mã sắp hết hạn` : undefined },
    { label: "Lên lịch", value: formatNumber(count("scheduled")) },
    { label: "Tổng lượt dùng", value: formatNumber(discounts.reduce((s, d) => s + d.used, 0)) },
    { label: "Đã giảm cho khách", value: formatMoneyShort(saved) },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Mã giảm giá
          </Typography.Title>
          <Typography.Text type="secondary">Tạo và theo dõi mã khách nhập ở bước thanh toán.</Typography.Text>
        </div>
        <Flex gap={8}>
          <Popconfirm title="Khôi phục dữ liệu mẫu?" description="Các thay đổi trên trình duyệt này sẽ mất." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
            <Button icon={<ReloadOutlined />}>Dữ liệu mẫu</Button>
          </Popconfirm>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing("new")}>
            Tạo mã
          </Button>
        </Flex>
      </Flex>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card style={{ height: "100%" }}>
              <Statistic title={s.label} value={s.value} />
              {s.note && (
                <Typography.Text type="warning" strong style={{ fontSize: 13 }}>
                  {s.note}
                </Typography.Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Card styles={{ body: { padding: 16 } }}>
        <Flex wrap gap={12} align="center">
          <Segmented<Filters["status"]>
            value={filters.status}
            onChange={(status) => setFilters({ ...filters, status })}
            aria-label="Trạng thái"
            options={statusOrder.map((s) => ({ value: s, label: `${s === "all" ? "Tất cả" : statusMeta[s].label} · ${count(s)}` }))}
            style={{ maxWidth: "100%", overflowX: "auto" }}
          />
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "#6b6b6b" }} />}
            placeholder="Tìm mã hoặc mô tả…"
            aria-label="Tìm mã giảm giá"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            style={{ flex: "1 1 220px" }}
          />
          <Select<Filters["sort"]>
            aria-label="Sắp xếp"
            value={filters.sort}
            onChange={(sort) => setFilters({ ...filters, sort })}
            options={[
              { value: "newest", label: "Mới tạo nhất" },
              { value: "ending", label: "Sắp hết hạn" },
              { value: "most-used", label: "Dùng nhiều nhất" },
            ]}
            style={{ flex: "0 1 170px", minWidth: 150 }}
          />
        </Flex>
      </Card>

      <Card styles={{ body: { padding: 12 } }}>
        {items.length ? (
          <DiscountTable items={items} api={api} onEdit={setEditing} pagination={pager.paginationProps(items.length, "mã")} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={discounts.length ? "Không có mã khớp bộ lọc." : "Chưa có mã giảm giá nào."}>
            {discounts.length ? (
              <Button onClick={() => setFilters(defaultFilters)}>Xóa bộ lọc</Button>
            ) : (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing("new")}>
                Tạo mã đầu tiên
              </Button>
            )}
          </Empty>
        )}
      </Card>

      <DiscountDrawer key={editing ?? "closed"} open={editing !== null} discount={current} api={api} onClose={() => setEditing(null)} />
    </Flex>
  );
}
