import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Drawer, Flex, Form, Grid, Input, Popconfirm, type FormRule } from "antd";
import { useDeferredValue, useRef, useState } from "react";
import { FormSection } from "@/components/form/form-section";
import { InfoFields } from "@/components/inventory/material/info-fields";
import { MaterialUsage } from "@/components/inventory/material/material-usage";
import { StockCard } from "@/components/inventory/material/stock-card";
import { StockFields } from "@/components/inventory/material/stock-fields";
import { RecipeField } from "@/components/products/recipe-field";
import { DrawerFormSkeleton } from "@/components/skeletons";
import type { InventoryApi } from "@/hooks/use-inventory";
import { unitLabel } from "@/lib/craft/groups";
import { uniqueId } from "@/lib/craft/steps";
import type { Unit } from "@/lib/craft/types";
import { lotPreview, lotTotal, purchaseCost, purchaseFrom, purchaseUnits, unitPrice, type LotPrice, type Purchase } from "@/lib/costs";
import { batchError, batchPlan, batchTotal, isMade, madeFrom, madeWith, type BatchPrice } from "@/lib/inventory/production";
import { DEFAULT_LOW_STOCK, toMap, type Usage } from "@/lib/inventory/stock";
import type { Material, MaterialCategory } from "@/lib/inventory/types";
import type { RecipeLine } from "@/lib/products/types";

type Values = {
  // Nguyên liệu mua về, hay xưởng tự sản xuất từ nguyên liệu khác trong Kho (vd hũ gốm từ thạch cao)
  source: "bought" | "made";
  // Sản xuất từ: định mức cho 1 đơn vị
  recipe?: (RecipeLine | undefined)[];
  // Tạo mới dạng sản xuất: số lượng làm mẻ đầu (cũng là tồn ban đầu) và giá mẻ
  makeCount?: number | null;
  makePrice?: BatchPrice;
  name: string;
  sku?: string;
  category: MaterialCategory;
  // Hũ: loại hũ và dung tích — các mã cùng loại là các cỡ của một hũ ở trang Thủ công
  jarType?: string;
  capacity?: number | null;
  unit: Unit;
  tracked: boolean;
  stock?: number;
  // Tiền mua số tồn ban đầu (chỉ khi tạo mới, có tồn)
  opening?: LotPrice;
  lowStock: number;
  // Giá nhập của nguyên liệu không theo dõi tồn — không có phiếu nhập để tự tính
  buy?: Purchase;
  hasSwatch: boolean;
  swatch?: string;
  note?: string;
};
type Props = { open: boolean; material?: Material; usage: Usage[]; api: InventoryApi; onClose: () => void };

const cleanRecipe = (lines?: (RecipeLine | undefined)[]) => (lines ?? []).filter((r): r is RecipeLine => !!r?.materialId && !!r.quantity);

// Thêm/sửa nguyên liệu. Nguyên liệu đã có: số tồn và giá nhập chỉ đổi qua thẻ tồn kho trên cùng (có lịch sử),
// form bên dưới chỉ sửa thông tin và cài đặt — không có ô nào trông như nhập hàng.
export function MaterialDrawer({ open, material, usage, api, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<Values>();
  const tracked = Form.useWatch("tracked", form);
  const unit = Form.useWatch("unit", form) ?? material?.unit ?? "pcs";
  const hasSwatch = Form.useWatch("hasSwatch", form);
  const category = Form.useWatch("category", form);
  // Tên tự điền gần nhất từ loại hũ + dung tích — admin đã sửa tên thì không ghi đè
  const autoName = useRef(material?.jarType && material.capacity ? `${material.jarType} ${material.capacity}ml` : "");
  const openingStock = Form.useWatch("stock", form);
  const opening = Form.useWatch("opening", form) as LotPrice | undefined;
  const buy = Form.useWatch("buy", form) as Purchase | undefined;
  const buyCost = purchaseCost(unit, buy);
  const openingCost = !material && openingStock ? lotPreview(0, undefined, openingStock, opening) : undefined;
  const made = (Form.useWatch("source", form) ?? (isMade(material) ? "made" : "bought")) === "made";
  const recipe = cleanRecipe(Form.useWatch("recipe", form) as (RecipeLine | undefined)[] | undefined);
  const makeCount = Form.useWatch("makeCount", form) as number | null | undefined;
  const makePrice = Form.useWatch("makePrice", form) as BatchPrice | undefined;
  const map = toMap(api.materials);
  const plan = batchPlan(recipe, makeCount ?? 0, map);
  const makeTotal = makeCount ? batchTotal(plan, makePrice) : undefined;
  const makeUnit = makeTotal !== undefined && makeCount ? unitPrice(makeTotal, makeCount) : undefined;
  // Công thức không được chọn chính nó và thứ đang làm từ nó (tránh vòng)
  const exclude = material ? api.materials.filter((m) => m.id === material.id || madeFrom(map, m.id, material.id)).map((m) => m.id) : [];
  const usedToMake = material ? madeWith(api.materials, material.id) : [];

  // Tạo mới dạng sản xuất: đủ nguyên liệu, có giá mới tạo được. 0 = chỉ lưu công thức, sản xuất sau
  const makeRule: FormRule = ({ getFieldValue }) => ({
    validator: (_, count?: number | null) => {
      const err = count ? batchError(batchPlan(cleanRecipe(getFieldValue("recipe")), count, map), getFieldValue("makePrice"), count) : null;
      return err ? Promise.reject(new Error(err)) : Promise.resolve();
    },
  });
  const history = material ? api.movements.filter((mv) => mv.materialId === material.id).slice(0, 20) : [];
  // Phiếu kho gõ dở trong thẻ tồn: Lưu thông tin không ghi phiếu đó, đóng drawer thì mất
  const [pending, setPending] = useState(false);

  const close = () => {
    if (!pending) return onClose();
    modal.confirm({
      title: "Bỏ phiếu kho chưa ghi nhận?",
      content: "Đã nhập số lượng nhưng chưa bấm Ghi nhận — số tồn chưa đổi.",
      okText: "Bỏ phiếu",
      cancelText: "Ở lại",
      onOk: onClose,
    });
  };

  const finish = (v: Values) => {
    if (pending) return message.warning("Phiếu kho chưa ghi nhận — bấm Ghi nhận trong thẻ tồn kho, hoặc xóa số lượng.");
    const makes = v.source === "made";
    const lines = makes ? cleanRecipe(v.recipe) : [];
    // Thành phẩm sản xuất luôn theo dõi tồn (làm tới đâu cộng tới đó)
    const tracked = makes || v.tracked;
    const count = !material && makes ? Math.max(0, Math.round(v.makeCount ?? 0)) : 0;
    const stock = material ? material.stock : !makes && tracked ? Math.max(0, Math.round(v.stock ?? 0)) : 0;
    const next: Omit<Material, "updatedAt"> = {
      id:
        material?.id ??
        uniqueId(
          v.name,
          api.materials.map((m) => m.id),
          "material",
        ),
      name: v.name.trim(),
      sku: v.sku?.trim() || undefined,
      category: v.category,
      jarType: v.category === "vessel" ? v.jarType?.trim() || undefined : undefined,
      capacity: v.category === "vessel" && v.capacity ? Math.round(v.capacity) : undefined,
      unit: v.unit,
      tracked,
      // Nguyên liệu mới: tồn ban đầu; đã có: giữ nguyên (đổi qua phiếu kho)
      stock,
      lowStock: Math.max(0, Math.round(v.lowStock ?? 0)),
      // Theo dõi tồn: giá lấy từ phiếu nhập có tiền / Sửa giá, form giữ nguyên số mới nhất.
      // Không theo dõi: sửa thẳng ở ô Giá nhập (chỉ khi có đụng tới, tránh làm tròn lại giá cũ)
      unitCost: !tracked && form.isFieldTouched("buy") ? purchaseCost(v.unit, v.buy) : material?.unitCost,
      recipe: lines.length ? lines : undefined,
      swatch: v.hasSwatch ? v.swatch : undefined,
      note: v.note?.trim() || undefined,
    };
    const openingTotal = !material && !makes && tracked && stock > 0 ? lotTotal(v.opening) : undefined;
    if (!api.saveMaterial(next, openingTotal)) return message.error("Bộ nhớ trình duyệt đã đầy.");
    // Mẻ đầu: trừ từng nguyên liệu (mỗi nguyên liệu một phiếu), cộng thành phẩm
    if (count > 0) api.produce(next.id, count, batchTotal(batchPlan(lines, count, map), v.makePrice) ?? 0, "Mẻ đầu tiên");
    message.success(material ? `Đã lưu ${next.name}` : `Đã thêm ${next.name} vào kho`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      title={material ? "Nguyên liệu" : "Thêm nguyên liệu"}
      size={screens.sm === false ? "100%" : 640}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {material && (
            <Popconfirm
              title={`Xóa “${material.name}” khỏi kho?`}
              description={
                [
                  usage.length ? `Đang dùng ở ${usage.length} lựa chọn trên web — các lựa chọn đó sẽ bị khóa như hết hàng.` : "",
                  usedToMake.length ? `Đang dùng để sản xuất ${usedToMake.map((m) => m.name).join(", ")} — xóa thì không sản xuất được nữa.` : "",
                ]
                  .filter(Boolean)
                  .join(" ") || "Xóa cả lịch sử nhập xuất. Không thể hoàn tác."
              }
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => {
                api.removeMaterial(material.id);
                message.success(`Đã xóa ${material.name}`);
                onClose();
              }}
            >
              <Button danger type="text" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
          <Button onClick={close} style={{ marginLeft: "auto" }}>
            Đóng
          </Button>
          <Button type="primary" onClick={() => form.submit()}>
            {material ? "Lưu thông tin" : "Thêm vào kho"}
          </Button>
        </Flex>
      }
    >
      {ready ? (
        <Flex vertical gap={16}>
          {material && <StockCard material={material} api={api} onPending={setPending} />}

          <Form
            form={form}
            layout="vertical"
            onFinish={finish}
            initialValues={{
              source: isMade(material) ? "made" : "bought",
              recipe: material?.recipe ?? [],
              makeCount: null,
              makePrice: { manual: false, total: null },
              name: material?.name ?? "",
              sku: material?.sku,
              category: material?.category ?? "other",
              jarType: material?.jarType,
              capacity: material?.capacity ?? null,
              unit: material?.unit ?? "pcs",
              tracked: material?.tracked ?? true,
              stock: 0,
              opening: { total: null, free: false },
              lowStock: material?.lowStock ?? DEFAULT_LOW_STOCK.pcs,
              buy: purchaseFrom(material?.unit ?? "pcs", material?.unitCost),
              hasSwatch: !!material?.swatch,
              swatch: material?.swatch ?? "#e8dccb",
              note: material?.note,
            }}
            onValuesChange={(changed: Partial<Values>) => {
              // Đổi đơn vị khi tạo mới thì gợi ý lại ngưỡng sắp hết
              if (!material && changed.unit) form.setFieldValue("lowStock", DEFAULT_LOW_STOCK[changed.unit]);
              // Đơn vị lúc mua đi theo đơn vị Kho (g → kg, ml → lít)
              if (changed.unit) form.setFieldValue("buy", { ...form.getFieldValue("buy"), unit: purchaseUnits[changed.unit][0].value });
              // Ô tiền đang báo lỗi thì đổi tồn ban đầu kiểm tra lại ngay — chưa báo thì chờ tới lúc bấm Thêm vào kho
              if (("stock" in changed || "opening" in changed) && form.getFieldError("opening").length) void form.validateFields(["opening"]).catch(() => undefined);
              // Hũ: điền sẵn tên theo loại hũ + dung tích ("Hũ thạch cao 150ml") khi tên còn trống hoặc đang là tên tự điền
              if ("jarType" in changed || "capacity" in changed) {
                const { jarType, capacity, name } = form.getFieldsValue(["jarType", "capacity", "name"]) as Values;
                const auto = jarType?.trim() && capacity ? `${jarType.trim()} ${capacity}ml` : "";
                if (auto && (!name?.trim() || name === autoName.current)) form.setFieldValue("name", auto);
                autoName.current = auto;
              }
              // Chọn Sản xuất thì mở sẵn một dòng công thức
              if (changed.source === "made" && !form.getFieldValue("recipe")?.length) form.setFieldValue("recipe", [{}]);
              // Ô số lượng sản xuất đang báo lỗi thì sửa công thức hay giá là kiểm tra lại
              if (("recipe" in changed || "makePrice" in changed) && form.getFieldError("makeCount").length) void form.validateFields(["makeCount"]).catch(() => undefined);
            }}
          >
            <Flex vertical gap={16}>
              <InfoFields material={material} materials={api.materials} usage={usage} category={category} hasSwatch={hasSwatch} />

              {made && (
                <FormSection title="Sản xuất từ" description={`Lượng nguyên liệu cho 1 ${unitLabel[unit]}. Mỗi lần sản xuất trừ kho theo lượng này × số lượng làm.`}>
                  <RecipeField required exclude={exclude} />
                </FormSection>
              )}

              {/* Nguyên liệu đã có: chỉ cài đặt (theo dõi, ngưỡng) — nhập / xuất và giá nằm ở thẻ tồn kho trên cùng */}
              <StockFields
                material={material}
                made={made}
                tracked={tracked}
                unit={unit}
                makeRule={makeRule}
                makeCount={makeCount}
                plan={plan}
                makeTotal={makeTotal}
                makeUnit={makeUnit}
                openingStock={openingStock}
                openingCost={openingCost}
                buyCost={buyCost}
              />

              <FormSection title="Ghi chú">
                <Form.Item name="note" noStyle>
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} maxLength={300} placeholder="VD: nhà cung cấp, hạn dùng, nơi cất…" />
                </Form.Item>
              </FormSection>
            </Flex>
          </Form>

          {material && <MaterialUsage usage={usage} history={history} materials={api.materials} />}
        </Flex>
      ) : (
        <DrawerFormSkeleton />
      )}
    </Drawer>
  );
}
