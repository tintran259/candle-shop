import { Tag } from "antd";
import { useCategories } from "@/hooks/use-categories";

// Tag danh mục theo cấu hình ở trang Danh mục
export function CategoryTag({ id }: { id?: string }) {
  const { byId, label } = useCategories();
  return (
    <Tag color={(id && byId.get(id)?.color) || "default"} style={{ marginInlineEnd: 0 }}>
      {label(id)}
    </Tag>
  );
}
