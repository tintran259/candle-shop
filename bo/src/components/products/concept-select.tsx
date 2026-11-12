import { Flex, Select, Tag } from "antd";
import { useConcepts } from "@/hooks/use-concepts";
import { outOfSeason } from "@/lib/products/concepts";

// Chọn concept cho sản phẩm (nhiều, không bắt buộc) — tag đúng màu ở trang Concept. Dùng trong Form.Item (value / onChange)
export function ConceptSelect(props: { value?: string[]; onChange?: (ids: string[]) => void }) {
  const { items, byId } = useConcepts();
  return (
    <Select
      {...props}
      mode="multiple"
      allowClear
      placeholder="Không thuộc concept nào"
      optionFilterProp="label"
      aria-label="Concept"
      options={items.map((c) => ({ value: c.id, label: c.hidden ? `${c.name.vi} (đang ẩn trên web)` : c.name.vi }))}
      tagRender={({ value, closable, onClose }) => {
        const c = byId.get(String(value));
        return (
          <Tag color={c?.color} closable={closable} onClose={onClose} style={{ marginInlineEnd: 4 }}>
            {c?.name.vi ?? String(value)}
          </Tag>
        );
      }}
    />
  );
}

// Tag các concept của sản phẩm (bảng, xem trước). Concept đã xóa thì bỏ qua.
// active: sản phẩm đang bán mà mọi concept (hiện) đều ngoài mùa → báo web đang ẩn
export function ConceptTags({ ids, active }: { ids?: string[]; active?: boolean }) {
  const { byId } = useConcepts();
  const list = (ids ?? []).flatMap((id) => byId.get(id) ?? []);
  if (!list.length) return null;
  return (
    <Flex gap={4} wrap>
      {active && outOfSeason(ids, byId) && (
        <Tag color="orange" style={{ marginInlineEnd: 0, fontSize: 11 }}>
          Ngoài mùa · web đang ẩn
        </Tag>
      )}
      {list.map((c) => (
        <Tag key={c.id} color={c.color} bordered={false} style={{ marginInlineEnd: 0, fontSize: 11 }}>
          {c.name.vi}
        </Tag>
      ))}
    </Flex>
  );
}
