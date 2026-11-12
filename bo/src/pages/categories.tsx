import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Popconfirm, Typography } from "antd";
import { useState } from "react";
import { TaxonomyModal } from "@/components/products/taxonomy-modal";
import { TaxonomyTable } from "@/components/products/taxonomy-table";
import { CategoriesSkeleton } from "@/components/skeletons";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { categoryKind } from "@/lib/products/categories";
import { useTitle } from "@/lib/use-title";

// Danh mục sản phẩm trưng bày (loại hương): thứ tự ở đây là thứ tự trong bộ lọc của web
export function CategoriesPage() {
  useTitle("Danh mục");
  const api = useCategories();
  const { products, loading } = useProducts();
  // null = đóng, "new" = thêm, còn lại là id đang sửa
  const [editing, setEditing] = useState<string | null>(null);

  if (api.loading || loading) return <CategoriesSkeleton />;

  const count = (id: string) => products.filter((p) => p.categoryId === id).length;
  const current = editing && editing !== "new" ? api.byId.get(editing) : undefined;

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Danh mục
          </Typography.Title>
          <Typography.Text type="secondary">Phân loại sản phẩm trưng bày theo loại hương. Kéo thả để sắp xếp thứ tự trong bộ lọc của web.</Typography.Text>
        </div>
        <Flex gap={8}>
          <Popconfirm title="Khôi phục danh mục mẫu?" description="Các thay đổi trên trình duyệt này sẽ mất." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
            <Button icon={<ReloadOutlined />}>Dữ liệu mẫu</Button>
          </Popconfirm>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing("new")}>
            Thêm danh mục
          </Button>
        </Flex>
      </Flex>

      <Card styles={{ body: { padding: 12 } }}>
        <TaxonomyTable api={api} kind={categoryKind} count={count} onEdit={setEditing} />
      </Card>

      <TaxonomyModal key={editing ?? "closed"} open={editing !== null && (editing === "new" || !!current)} item={current} api={api} kind={categoryKind} onClose={() => setEditing(null)} />
    </Flex>
  );
}
