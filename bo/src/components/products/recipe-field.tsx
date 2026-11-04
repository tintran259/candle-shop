import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Form, InputNumber, Typography } from "antd";
import { MaterialSelect } from "@/components/inventory/material-select";
import { useInventory } from "@/hooks/use-inventory";
import { margin, needsCost } from "@/lib/costs";
import { unitLabel } from "@/lib/craft/groups";
import { formatMoney } from "@/lib/format";
import { toMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import type { RecipeLine } from "@/lib/products/types";

function RecipeRow({ name, materials, onRemove }: { name: number; materials: Material[]; onRemove: () => void }) {
  const materialId = Form.useWatch(["recipe", name, "materialId"]) as string | undefined;
  const unit = materials.find((m) => m.id === materialId)?.unit;
  return (
    <Flex gap={8} align="flex-start">
      <Form.Item
        name={[name, "materialId"]}
        rules={[
          { required: true, message: "Chọn nguyên liệu." },
          ({ getFieldValue }) => ({
            validator: (_, v?: string) =>
              (getFieldValue("recipe") as { materialId?: string }[]).filter((r) => r?.materialId === v).length > 1
                ? Promise.reject(new Error("Nguyên liệu này đã có trong công thức."))
                : Promise.resolve(),
          }),
        ]}
        style={{ flex: 1, minWidth: 0, marginBottom: 12 }}
      >
        <MaterialSelect materials={materials} allowNone={false} ariaLabel={`Nguyên liệu dòng ${name + 1}`} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name={[name, "quantity"]} rules={[{ required: true, type: "number", min: 1, message: "Nhập lượng." }]} style={{ width: 120, marginBottom: 12 }}>
        <InputNumber min={1} precision={0} suffix={unit && unitLabel[unit]} placeholder="Lượng" aria-label={`Lượng dòng ${name + 1}`} style={{ width: "100%" }} />
      </Form.Item>
      <Button type="text" icon={<DeleteOutlined />} aria-label={`Xóa dòng ${name + 1}`} onClick={onRemove} />
    </Flex>
  );
}

// Công thức cho 1 cây (hoặc 1 đơn vị bán thành phẩm ở Kho). required: bắt buộc có ít nhất một nguyên liệu.
// exclude: nguyên liệu không được chọn (chính nó, thứ đang làm từ nó)
export function RecipeField({ required, exclude }: { required: boolean; exclude?: string[] }) {
  const materials = useInventory().materials.filter((m) => m.tracked && !exclude?.includes(m.id));
  return (
    <Form.List
      name="recipe"
      rules={[{ validator: (_, lines?: unknown[]) => (required && !lines?.length ? Promise.reject(new Error("Thêm ít nhất một nguyên liệu.")) : Promise.resolve()) }]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          {fields.map((field) => (
            <RecipeRow key={field.key} name={field.name} materials={materials} onRemove={() => remove(field.name)} />
          ))}
          <Button icon={<PlusOutlined />} onClick={() => add()}>
            Thêm nguyên liệu
          </Button>
          {errors.length > 0 && (
            <Typography.Text type="danger" style={{ display: "block", marginTop: 8 }}>
              {errors}
            </Typography.Text>
          )}
        </>
      )}
    </Form.List>
  );
}

// Giá vốn 1 cây theo công thức đang nhập và lãi trên giá thực bán (giá giảm nếu có)
export function RecipeCost() {
  const form = Form.useFormInstance();
  const { materials } = useInventory();
  const recipe = (Form.useWatch("recipe", form) ?? []) as (RecipeLine | undefined)[];
  const price = Form.useWatch("price", form) as number | undefined;
  const salePrice = Form.useWatch("salePrice", form) as number | null | undefined;
  const lines = recipe.filter((r): r is RecipeLine => !!r?.materialId && !!r.quantity);
  if (!lines.length) return null;
  const needs = new Map<string, number>();
  for (const r of lines) needs.set(r.materialId, (needs.get(r.materialId) ?? 0) + r.quantity);
  const cost = needsCost(needs, toMap(materials));
  const result = margin(salePrice || price || 0, cost.cost);
  return (
    <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }} aria-label="Giá vốn 1 cây">
      Giá vốn nguyên liệu 1 cây: <Typography.Text strong className="tabular">{formatMoney(cost.cost)}</Typography.Text>
      {result.percent !== null && ` · lãi ${Math.round(result.percent * 100)}% trên giá bán`}
      {cost.missing.length > 0 && (
        <Typography.Text type="warning" style={{ display: "block", fontSize: 12 }}>
          Chưa có giá nhập: {cost.missing.map((m) => m.name).join(", ")}
        </Typography.Text>
      )}
    </Typography.Paragraph>
  );
}
