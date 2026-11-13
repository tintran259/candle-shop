import { GiftOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Popconfirm, Typography } from "antd";
import { useState } from "react";
import { TaxonomyModal } from "@/components/products/taxonomy-modal";
import { TaxonomyTable } from "@/components/products/taxonomy-table";
import { CategoriesSkeleton } from "@/components/skeletons";
import { useConcepts } from "@/hooks/use-concepts";
import { useProducts } from "@/hooks/use-products";
import { REMOTE } from "@/lib/data-mode";
import { missingPresets } from "@/lib/products/concept-presets";
import { conceptKind, rangeText } from "@/lib/products/concepts";
import { useTitle } from "@/lib/use-title";

// Concept (dịp lễ: Noel, Tết…) — phân loại thứ hai bên cạnh danh mục. Gắn vào sản phẩm ở drawer Sản phẩm (nhiều, không bắt buộc).
// Thứ tự ở đây là thứ tự hàng lọc Concept trên web
export function ConceptsPage() {
  useTitle("Concept");
  const api = useConcepts();
  const { products, loading } = useProducts();
  // null = đóng, "new" = thêm, còn lại là id đang sửa
  const [editing, setEditing] = useState<string | null>(null);

  if (api.loading || loading) return <CategoriesSkeleton />;

  const count = (id: string) => products.filter((p) => p.conceptIds?.includes(id)).length;
  const current = editing && editing !== "new" ? api.byId.get(editing) : undefined;
  // Concept lễ thường có (Noel, Tết, Valentine) chưa tạo — tạo nhanh kèm thời gian bán gợi ý
  const presets = missingPresets(api.items);

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Concept
          </Typography.Title>
          <Typography.Text type="secondary">
            Bộ sưu tập theo dịp lễ (Noel, Tết…). Một sản phẩm có thể thuộc nhiều concept — chọn ở drawer Sản phẩm. Kéo thả để sắp xếp thứ tự trong bộ lọc của web.
          </Typography.Text>
        </div>
        <Flex gap={8}>
          {!REMOTE && (
            <Popconfirm title="Khôi phục concept mẫu?" description="Các thay đổi trên trình duyệt này sẽ mất." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
              <Button icon={<ReloadOutlined />}>Dữ liệu mẫu</Button>
            </Popconfirm>
          )}
          {presets.length > 0 && (
            <Popconfirm
              title="Tạo nhanh concept lễ"
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {presets.map((c) => (
                    <li key={c.id}>
                      {c.name.vi}: {rangeText(c)}
                    </li>
                  ))}
                </ul>
              }
              okText="Thêm"
              cancelText="Hủy"
              onConfirm={() => presets.forEach((c) => api.save(c))}
            >
              <Button icon={<GiftOutlined />}>Tạo nhanh concept lễ</Button>
            </Popconfirm>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing("new")}>
            Thêm concept
          </Button>
        </Flex>
      </Flex>

      <Card styles={{ body: { padding: 12 } }}>
        <TaxonomyTable api={api} kind={conceptKind} count={count} onEdit={setEditing} />
      </Card>

      <TaxonomyModal key={editing ?? "closed"} open={editing !== null && (editing === "new" || !!current)} item={current} api={api} kind={conceptKind} onClose={() => setEditing(null)} />
    </Flex>
  );
}
