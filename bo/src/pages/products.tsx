import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Flex, Grid, Pagination, Popconfirm, Row, Statistic, Typography } from "antd";
import { useState } from "react";
import { ProductDrawer } from "@/components/products/product-drawer";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductTable } from "@/components/products/product-table";
import { ProductToolbar } from "@/components/products/product-toolbar";
import { ListPageSkeleton } from "@/components/skeletons";
import { useProducts } from "@/hooks/use-products";
import { applyFilters, defaultFilters, type ProductFilters, type ViewMode } from "@/lib/products/filters";
import { discountPercent } from "@/lib/products/labels";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

// Quản lý sản phẩm nến bán sẵn trên web
export function ProductsPage() {
  useTitle("Sản phẩm");
  const api = useProducts();
  const screens = Grid.useBreakpoint();
  const [filters, setFiltersState] = useState<ProductFilters>(defaultFilters);
  const items = applyFilters(api.products, filters);
  const pager = usePageQuery(api.loading ? undefined : items.length);
  // Đổi bộ lọc thì quay về trang 1
  const setFilters = (f: ProductFilters) => {
    setFiltersState(f);
    pager.resetPage();
  };
  const [view, setView] = useState<ViewMode | null>(null);
  // null = đóng, "new" = thêm mới, còn lại là id đang sửa
  const [editing, setEditing] = useState<string | null>(null);

  const { products } = api;
  // Mobile mặc định xem dạng lưới cho dễ bấm
  const mode: ViewMode = view ?? (screens.md === false ? "grid" : "table");
  const current = editing && editing !== "new" ? products.find((p) => p.id === editing) : undefined;

  if (api.loading) return <ListPageSkeleton label="Đang tải sản phẩm…" />;

  const pagination = pager.paginationProps(items.length, "sản phẩm");
  const stats = [
    { label: "Sản phẩm", value: products.length },
    { label: "Đang bán", value: products.filter((p) => p.status === "active").length },
    { label: "Đang giảm giá", value: products.filter((p) => discountPercent(p) > 0).length },
    { label: "Nổi bật", value: products.filter((p) => p.isFeatured).length },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Sản phẩm
          </Typography.Title>
          <Typography.Text type="secondary">Nến làm sẵn theo mẫu — khách đặt, xưởng làm trong 2–3 ngày.</Typography.Text>
        </div>
        <Flex gap={8}>
          <Popconfirm title="Khôi phục dữ liệu mẫu?" description="Các thay đổi trên trình duyệt này sẽ mất." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
            <Button icon={<ReloadOutlined />}>Dữ liệu mẫu</Button>
          </Popconfirm>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing("new")}>
            Thêm sản phẩm
          </Button>
        </Flex>
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
        <ProductToolbar
          filters={filters}
          onChange={setFilters}
          counts={{
            all: products.length,
            active: products.filter((p) => p.status === "active").length,
            hidden: products.filter((p) => p.status === "hidden").length,
          }}
          view={mode}
          onViewChange={setView}
        />
      </Card>

      {items.length === 0 ? (
        <Card>
          <Empty
            description={products.length ? "Không có sản phẩm khớp bộ lọc." : "Chưa có sản phẩm nào."}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {products.length ? (
              <Button onClick={() => setFilters(defaultFilters)}>Xóa bộ lọc</Button>
            ) : (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing("new")}>
                Thêm sản phẩm đầu tiên
              </Button>
            )}
          </Empty>
        </Card>
      ) : mode === "table" ? (
        <Card styles={{ body: { padding: 12 } }}>
          <ProductTable items={items} api={api} onEdit={setEditing} pagination={pagination} />
        </Card>
      ) : (
        <Flex vertical gap={16}>
          <ProductGrid items={pager.paginate(items).pageItems} api={api} onEdit={setEditing} />
          <Card styles={{ body: { padding: "12px 16px" } }}>
            <Flex justify="flex-end">
              <Pagination {...pagination} />
            </Flex>
          </Card>
        </Flex>
      )}

      <ProductDrawer key={editing ?? "closed"} open={editing !== null} product={current} api={api} onClose={() => setEditing(null)} />
    </Flex>
  );
}
