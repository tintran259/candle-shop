import { SearchOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Empty, Flex, Input, Row, Segmented, Statistic, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CancelledDrawer } from "@/components/cancelled/cancelled-drawer";
import { CancelledTable } from "@/components/cancelled/cancelled-table";
import { CancelledSkeleton } from "@/components/skeletons";
import { useCancelledProducts } from "@/hooks/use-cancelled-products";
import { applyFilters, defaultFilters, statusMeta, type CancelledFilters } from "@/lib/cancelled/labels";
import { cancelledStatuses, type CancelledProduct } from "@/lib/cancelled/types";
import { useDrawerTarget, useOpenParam } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

// Nến thủ công đã làm xong nhưng đơn bị hủy — tự sinh khi hủy đơn, admin tạo sản phẩm trưng bày hoặc bỏ đi
export function CancelledProductsPage() {
  useTitle("Sản phẩm hủy đơn");
  const { message } = App.useApp();
  const navigate = useNavigate();
  const api = useCancelledProducts();
  const { save } = api;
  const [filters, setFiltersState] = useState<CancelledFilters>(defaultFilters);
  const items = useMemo(() => applyFilters(api.items, filters), [api.items, filters]);
  const pager = usePageQuery(api.loading ? undefined : items.length);
  const { paginationProps } = pager;
  const pagination = useMemo(() => paginationProps(items.length, "sản phẩm"), [paginationProps, items.length]);
  const setFilters = (f: CancelledFilters) => {
    setFiltersState(f);
    pager.resetPage();
  };
  const [openId, setOpenId] = useOpenParam("item");
  const { shown, key: drawerKey } = useDrawerTarget(openId);
  const current = api.items.find((c) => c.id === shown);

  // Sang trang Sản phẩm trưng bày với drawer đã điền sẵn; chỉ khi lưu xong mới đổi trạng thái
  const create = useCallback((id: string) => navigate(`/products?edit=from:${id}`), [navigate]);
  const discard = useCallback(
    (c: CancelledProduct) => {
      save(c.id, { status: "discarded" });
      message.success(`Đã bỏ ${c.name}`);
    },
    [save, message],
  );

  if (api.loading) return <CancelledSkeleton />;

  const count = (s: (typeof cancelledStatuses)[number]) => api.items.filter((c) => c.status === s).length;
  const stats = [{ label: "Tổng sản phẩm", value: api.items.length }, ...cancelledStatuses.map((s) => ({ label: statusMeta[s].label, value: count(s) }))];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Sản phẩm hủy đơn
          </Typography.Title>
          <Typography.Text type="secondary">Nến thủ công đã làm xong nhưng đơn bị hủy. Chỉ quản lý ở BO, không hiện trên web.</Typography.Text>
        </div>
      </Flex>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card>
              <Statistic title={s.label} value={s.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card styles={{ body: { padding: 16 } }}>
        <Flex wrap gap={12} align="center">
          <div style={{ maxWidth: "100%", overflowX: "auto" }}>
            <Segmented<CancelledFilters["status"]>
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status })}
              aria-label="Trạng thái"
              options={[{ value: "all", label: `Tất cả · ${api.items.length}` }, ...cancelledStatuses.map((s) => ({ value: s, label: `${statusMeta[s].label} · ${count(s)}` }))]}
            />
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "#6b6b6b" }} />}
            placeholder="Tìm theo tên, mã đơn, khách…"
            aria-label="Tìm sản phẩm hủy đơn"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            style={{ flex: "1 1 240px" }}
          />
        </Flex>
      </Card>

      {items.length === 0 ? (
        <Card>
          <Empty description={api.items.length ? "Không có sản phẩm khớp bộ lọc." : "Chưa có sản phẩm nào. Hủy đơn có nến thủ công đã làm thì nến sẽ tự vào đây."} image={Empty.PRESENTED_IMAGE_SIMPLE}>
            {api.items.length > 0 && <Button onClick={() => setFilters(defaultFilters)}>Xóa bộ lọc</Button>}
          </Empty>
        </Card>
      ) : (
        <Card styles={{ body: { padding: 12 } }}>
          <CancelledTable items={items} onOpen={setOpenId} onCreate={create} onDiscard={discard} pagination={pagination} />
        </Card>
      )}

      <CancelledDrawer key={drawerKey} open={!!openId && !!current} item={current} onCreate={create} onDiscard={discard} onClose={() => setOpenId(null)} />
    </Flex>
  );
}
