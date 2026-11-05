import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Flex, Grid, Pagination, Row, Statistic, Typography } from "antd";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ProductDrawer } from "@/components/products/product-drawer";
import { fromCancelled } from "@/components/products/product-form";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductTable } from "@/components/products/product-table";
import { ProductToolbar } from "@/components/products/product-toolbar";
import { ProductsSkeleton } from "@/components/skeletons";
import { useCancelledProducts } from "@/hooks/use-cancelled-products";
import { useProducts } from "@/hooks/use-products";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import { toMap } from "@/lib/inventory/stock";
import { productsToReview } from "@/lib/products/pricing";
import { applyFilters, defaultFilters, type ProductFilters, type ViewMode } from "@/lib/products/filters";
import { discountPercent } from "@/lib/products/labels";
import { useDrawerTarget, useOpenParam } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

// Sản phẩm trưng bày: mẫu nến hiện trên web để khách đặt, có công thức nguyên liệu, không giữ số tồn thành phẩm
export function ProductsPage() {
  useTitle("Sản phẩm trưng bày");
  const api = useProducts();
  const cancelled = useCancelledProducts();
  const screens = Grid.useBreakpoint();
  // ?category= từ trang Danh mục: mở sẵn bộ lọc theo danh mục đó
  const [params] = useSearchParams();
  const [filters, setFiltersState] = useState<ProductFilters>(() => ({ ...defaultFilters, categoryId: params.get("category") ?? undefined }));
  // Giá vốn theo giá nhập hiện tại: giá nhập tăng sau khi tạo sản phẩm thì báo lại ở đây
  const inventory = useInventory();
  const { settings } = useSettings();
  const review = useMemo(() => productsToReview(api.products, toMap(inventory.materials), settings.minMargin), [api.products, inventory.materials, settings.minMargin]);
  // Memo để bảng/lưới (memo) chỉ render lại khi dữ liệu/bộ lọc/trang đổi — không phải khi mở drawer
  const items = useMemo(() => applyFilters(api.products, filters, review), [api.products, filters, review]);
  const pager = usePageQuery(api.loading ? undefined : items.length);
  const { paginationProps, paginate } = pager;
  const pagination = useMemo(() => paginationProps(items.length, "sản phẩm"), [paginationProps, items.length]);
  const pageItems = useMemo(() => paginate(items).pageItems, [paginate, items]);
  // Đổi bộ lọc thì quay về trang 1
  const setFilters = (f: ProductFilters) => {
    setFiltersState(f);
    pager.resetPage();
  };
  const [view, setView] = useState<ViewMode | null>(null);
  // Trên URL (?edit=): null = đóng, "new" = thêm mới, "from:<id>" = tạo từ nến hủy đơn, còn lại là id đang sửa
  const [editing, setEditing] = useOpenParam("edit");

  const { products } = api;
  // Nến hủy đơn: công thức của nến tự phối điền sẵn ở phần phụ kiện khác
  const { config } = useCraftConfig();
  // Mobile mặc định xem dạng lưới cho dễ bấm
  const mode: ViewMode = view ?? (screens.md === false ? "grid" : "table");
  // Đóng drawer thì URL bỏ ?edit= ngay — giữ mục cũ (cùng key) để drawer trượt ra có hiệu ứng
  const { shown, key: drawerKey } = useDrawerTarget(editing);
  const current = shown && shown !== "new" ? products.find((p) => p.id === shown) : undefined;

  // Cây nến đã xử lý rồi thì không tạo lại được
  const fromItem = shown?.startsWith("from:") ? cancelled.items.find((c) => c.id === shown.slice(5) && c.status === "pending") : undefined;

  if (api.loading || cancelled.loading || inventory.loading) return <ProductsSkeleton />;

  const prefill = fromItem && fromCancelled(fromItem, api.products, fromItem.recipe ?? [], config);

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
            Sản phẩm trưng bày
          </Typography.Title>
          <Typography.Text type="secondary">Mẫu nến hiện trên web để khách đặt, xưởng làm trong 2–3 ngày. Dựng từ nguyên liệu trong Kho, giữ và trừ Kho theo công thức.</Typography.Text>
        </div>
        <Flex gap={8}>
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

      {(review.size > 0 || filters.review) && (
        <Alert
          type="warning"
          showIcon
          title={review.size ? `${review.size} sản phẩm cần xem lại giá bán` : "Không còn sản phẩm nào cần xem lại giá"}
          description={`Giá bán (hoặc giá giảm) thấp hơn giá vốn công thức theo giá nhập hiện tại trong Kho, hoặc lãi dưới ${settings.minMargin}%.`}
          action={
            <Button size="small" onClick={() => setFilters({ ...filters, review: !filters.review })}>
              {filters.review ? "Xem tất cả" : "Chỉ xem các sản phẩm này"}
            </Button>
          }
        />
      )}

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
          <ProductTable items={items} api={api} onEdit={setEditing} pagination={pagination} review={review} />
        </Card>
      ) : (
        <Flex vertical gap={16}>
          <ProductGrid items={pageItems} api={api} onEdit={setEditing} review={review} />
          <Card styles={{ body: { padding: "12px 16px" } }}>
            <Flex justify="flex-end">
              <Pagination {...pagination} />
            </Flex>
          </Card>
        </Flex>
      )}

      <ProductDrawer
        key={drawerKey}
        open={editing !== null && (editing === "new" || !!current || !!fromItem)}
        product={current}
        prefill={prefill}
        source={fromItem && `Lấy từ nến của đơn hủy ${fromItem.orderCode}. Kiểm tra lại thông tin trước khi tạo.`}
        api={api}
        onCreated={fromItem && ((p) => cancelled.save(fromItem.id, { status: "converted", displayProductId: p.id }))}
        onClose={() => setEditing(null)}
      />
    </Flex>
  );
}
