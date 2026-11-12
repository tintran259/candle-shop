import { AppstoreOutlined, SearchOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Segmented, Select } from "antd";
import { defaultFilters, type ProductFilters, type ViewMode } from "@/lib/products/filters";
import { useCategories } from "@/hooks/use-categories";
import { useConcepts } from "@/hooks/use-concepts";
import { sizeLabels, sortOptions, toOptions } from "@/lib/products/labels";

type Props = {
  filters: ProductFilters;
  onChange: (f: ProductFilters) => void;
  counts: Record<ProductFilters["status"], number>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
};

// Thanh lọc 2 hàng: (1) trạng thái · sắp xếp + kiểu xem, (2) tìm kiếm + bộ lọc thuộc tính
export function ProductToolbar({ filters, onChange, counts, view, onViewChange }: Props) {
  const { categories } = useCategories();
  const concepts = useConcepts();
  const set = (patch: Partial<ProductFilters>) => onChange({ ...filters, ...patch });
  const dirty = filters.q || filters.status !== "all" || filters.categoryId || filters.conceptId || filters.size;

  return (
    <Flex vertical gap={12}>
      <Flex wrap gap={12} align="center" justify="space-between">
        <Segmented<ProductFilters["status"]>
          value={filters.status}
          onChange={(status) => set({ status })}
          aria-label="Trạng thái"
          options={[
            { value: "all", label: `Tất cả · ${counts.all}` },
            { value: "active", label: `Đang bán · ${counts.active}` },
            { value: "hidden", label: `Tạm ẩn · ${counts.hidden}` },
          ]}
        />
        <Flex gap={8} align="center">
          <Select aria-label="Sắp xếp" value={filters.sort} onChange={(sort) => set({ sort })} options={sortOptions.map((o) => ({ ...o }))} style={{ width: 160 }} />
          <Segmented<ViewMode>
            value={view}
            onChange={onViewChange}
            aria-label="Kiểu xem"
            options={[
              { value: "table", icon: <UnorderedListOutlined />, title: "Xem dạng bảng" },
              { value: "grid", icon: <AppstoreOutlined />, title: "Xem dạng lưới" },
            ]}
          />
        </Flex>
      </Flex>

      <Flex wrap gap={12} align="center">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: "#6b6b6b" }} />}
          placeholder="Tìm theo tên hoặc slug…"
          aria-label="Tìm sản phẩm"
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
          style={{ flex: "1 1 240px" }}
        />
        <Select
          allowClear
          placeholder="Danh mục"
          aria-label="Lọc theo danh mục"
          value={filters.categoryId}
          onChange={(categoryId) => set({ categoryId })}
          options={categories.map((c) => ({ value: c.id, label: c.name.vi }))}
          style={{ flex: "0 1 160px", minWidth: 130 }}
        />
        <Select
          allowClear
          placeholder="Concept"
          aria-label="Lọc theo concept"
          value={filters.conceptId}
          onChange={(conceptId) => set({ conceptId })}
          options={concepts.items.map((c) => ({ value: c.id, label: c.name.vi }))}
          style={{ flex: "0 1 150px", minWidth: 120 }}
        />
        <Select
          allowClear
          placeholder="Kích thước"
          aria-label="Lọc theo kích thước"
          value={filters.size}
          onChange={(size) => set({ size })}
          options={toOptions(sizeLabels)}
          style={{ flex: "0 1 150px", minWidth: 120 }}
        />
        {dirty && (
          <Button type="link" onClick={() => onChange({ ...defaultFilters, sort: filters.sort })} style={{ paddingInline: 4 }}>
            Xóa bộ lọc
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
