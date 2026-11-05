import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Empty, Flex, Form, InputNumber, Row, Typography } from "antd";
import { useMemo } from "react";
import { Link } from "react-router";
import { CostCheck, SuggestButton } from "@/components/craft/margin";
import { FormSection } from "@/components/form/form-section";
import { MaterialSelect } from "@/components/inventory/material-select";
import { CraftStepSections } from "@/components/orders/custom-candle-modal";
import { cleanBuild, type BuildValues } from "@/components/products/product-form";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import { needsCost } from "@/lib/costs";
import { needsReview, suggestPrice, type PriceCheck } from "@/lib/craft/pricing";
import { describeSelection, maxJars, type CraftSelection } from "@/lib/craft/selection";
import { unitLabel } from "@/lib/craft/groups";
import { formatMoney, formatNumber } from "@/lib/format";
import { toMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { buildIssues, buildSize, craftPrice, extrasPrice, productSteps, recipeFromBuild, sizeFromCapacity } from "@/lib/products/build";
import { sizeLabels } from "@/lib/products/labels";

// Ô chọn theo các bước Thủ công, giống popup Tự phối nến. Lỗi từng bước chỉ hiện sau khi bấm lưu
function CraftPicker({ value, onChange }: { value?: CraftSelection; onChange?: (v: CraftSelection) => void }) {
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  const map = useMemo(() => toMap(materials), [materials]);
  const { status } = Form.Item.useStatus();
  const selection = value ?? {};
  const steps = productSteps(config);
  if (!steps.length)
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trang Thủ công chưa có bước nào đang hiện.">
        <Link to="/craft">Mở trang Thủ công</Link>
      </Empty>
    );
  const issues = status === "error" ? buildIssues({ selection, extras: [] }, config, map) : [];
  return (
    // Drawer hẹp hơn popup: thẻ rộng hơn để tên không bị cắt
    <div className="product-craft">
      <CraftStepSections steps={steps} config={config} selection={selection} map={map} issues={issues} onChange={(stepId, next) => onChange?.({ ...selection, [stepId]: next })} />
    </div>
  );
}

// Nguyên liệu theo các bước Thủ công + phụ kiện khác lấy thẳng từ Kho.
// required: phải chọn đủ các bước bắt buộc (sản phẩm mới), trừ khi đã có công thức sẵn ở phụ kiện khác (nến hủy đơn, sản phẩm cũ)
export function ProductBuildFields({ required }: { required: boolean }) {
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  const map = useMemo(() => toMap(materials), [materials]);
  const tracked = materials.filter((m) => m.tracked);
  return (
    <>
      <FormSection
        title="Nguyên liệu"
        description={
          <>
            Chọn giống nến tự phối, theo các bước ở <Link to="/craft">Thủ công</Link>. Lượng sáp, hương, màu theo cỡ hũ đã chọn; giữ và trừ Kho theo công thức này.
          </>
        }
      >
        <Form.Item
          name={["build", "selection"]}
          validateTrigger={[]}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, selection?: CraftSelection) => {
                const extras = (
                  (getFieldValue(["build", "extras"]) ?? []) as {
                    materialId?: string;
                  }[]
                ).filter((e) => e?.materialId);
                if (!required || extras.length) return Promise.resolve();
                const issues = buildIssues({ selection: selection ?? {}, extras: [] }, config, map);
                return issues.length ? Promise.reject(new Error(`Còn ${issues.length} bước cần chọn lại.`)) : Promise.resolve();
              },
            }),
          ]}
          style={{ marginBottom: 0 }}
        >
          <CraftPicker />
        </Form.Item>
      </FormSection>

      <FormSection
        title="Phụ kiện khác"
        description="Nguyên liệu không có ở các bước Thủ công (bao bì, phụ kiện…), lượng và giá bán cho 1 cây. Giá bán cộng vào giá tham khảo; để trống thì không tính tiền. Công thức có sẵn của nến hủy đơn hoặc sản phẩm cũ cũng nằm ở đây."
      >
        <Form.List name={["build", "extras"]}>
          {(fields, { add, remove }) => (
            <Flex vertical>
              {fields.map((field) => (
                <ExtraRow key={field.key} name={field.name} materials={tracked} onRemove={() => remove(field.name)} />
              ))}
              <Button icon={<PlusOutlined />} onClick={() => add({})} style={{ alignSelf: "flex-start" }}>
                Thêm phụ kiện
              </Button>
            </Flex>
          )}
        </Form.List>
      </FormSection>
    </>
  );
}

// Giá bán phụ kiện so với giá vốn của lượng đó (giá nhập bình quân trong Kho)
function ExtraPriceCheck({ name, materials }: { name: number; materials: Material[] }) {
  const form = Form.useFormInstance();
  const { settings } = useSettings();
  const line = (Form.useWatch(["build", "extras", name], form) ?? {}) as {
    materialId?: string;
    quantity?: number;
    price?: number | null;
  };
  if (!line.materialId || !line.quantity) return null;
  const map = toMap(materials);
  const cost = needsCost(new Map([[line.materialId, line.quantity]]), map);
  const price = line.price ?? 0;
  const check: PriceCheck = {
    price,
    floor: cost.cost,
    missing: cost.missing,
    margin: price > 0 ? (price - cost.cost) / price : null,
  };
  return (
    <div role="group" aria-label={`Giá vốn phụ kiện dòng ${name + 1}`} style={{ margin: "-6px 0 12px" }}>
      {/* Chưa nhập giá: coi như tặng kèm, không báo thấp hơn vốn */}
      <CostCheck c={check} min={settings.minMargin} inline status={price ? undefined : <Typography.Text type="secondary">Chưa tính tiền khách</Typography.Text>}>
        {cost.cost > 0 && (!price || needsReview(check, settings.minMargin)) && (
          <SuggestButton
            value={suggestPrice(cost.cost, settings)}
            current={price}
            label={`Gợi ý giá phụ kiện dòng ${name + 1}`}
            onApply={(v) => form.setFieldValue(["build", "extras", name, "price"], v)}
          />
        )}
      </CostCheck>
    </div>
  );
}

function ExtraRow({ name, materials, onRemove }: { name: number; materials: Material[]; onRemove: () => void }) {
  const materialId = Form.useWatch(["build", "extras", name, "materialId"]) as string | undefined;
  const unit = materials.find((m) => m.id === materialId)?.unit;
  return (
    <>
      <Row gutter={8} wrap={false} align="top">
        <Col flex="auto" style={{ minWidth: 0 }}>
          <Form.Item
            name={[name, "materialId"]}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, v?: string) =>
                  v &&
                  (
                    getFieldValue(["build", "extras"]) as {
                      materialId?: string;
                    }[]
                  ).filter((r) => r?.materialId === v).length > 1
                    ? Promise.reject(new Error("Đã có trong danh sách."))
                    : Promise.resolve(),
              }),
            ]}
            style={{ marginBottom: 12 }}
          >
            <MaterialSelect materials={materials} allowNone={false} placeholder="Chọn nguyên liệu trong Kho" ariaLabel={`Phụ kiện dòng ${name + 1}`} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col flex="112px">
          <Form.Item
            name={[name, "quantity"]}
            rules={[
              {
                required: true,
                type: "number",
                min: 0.1,
                message: "Nhập lượng.",
              },
            ]}
            style={{ marginBottom: 12 }}
          >
            <InputNumber min={0} precision={1} suffix={unit && unitLabel[unit]} placeholder="Lượng" aria-label={`Lượng phụ kiện dòng ${name + 1}`} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col flex="140px">
          <Form.Item name={[name, "price"]} style={{ marginBottom: 12 }}>
            <InputNumber<number>
              min={0}
              step={1000}
              precision={0}
              suffix="₫"
              placeholder="Giá bán"
              aria-label={`Giá bán phụ kiện dòng ${name + 1}`}
              formatter={(v) => (v ? formatNumber(Number(v)) : "")}
              parser={(v) => Number((v ?? "").replace(/\D/g, ""))}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col flex="32px">
          <Button type="text" icon={<DeleteOutlined />} aria-label={`Xóa phụ kiện dòng ${name + 1}`} onClick={onRemove} />
        </Col>
      </Row>
      <ExtraPriceCheck name={name} materials={materials} />
    </>
  );
}

// Tóm tắt giống popup Tự phối: mô tả, giá theo Thủ công, giá vốn, công thức trừ Kho, số cây Kho đủ làm
export function BuildSummary() {
  const form = Form.useFormInstance();
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  const map = useMemo(() => toMap(materials), [materials]);
  const values = (Form.useWatch("build", form) ?? {
    selection: {},
    extras: [],
  }) as BuildValues;
  const build = cleanBuild(values);
  const recipe = recipeFromBuild(build, config, map);
  const size = buildSize(build, config);
  const description = describeSelection({ ...config, steps: productSteps(config) }, build.selection);
  const craft = craftPrice(build, config);
  const extra = extrasPrice(build);
  const reference = craft + extra;
  const needs = new Map(recipe.map((r) => [r.materialId, r.quantity]));
  const cost = needsCost(needs, map);
  const n = maxJars(needs, map);
  return (
    <FormSection title="Tóm tắt nguyên liệu" description="Theo giá nhập bình quân và số tồn trong Kho.">
      <Flex vertical gap={8} role="group" aria-label="Tóm tắt nguyên liệu">
        <Typography.Text style={{ fontSize: 13 }}>{description || "Chưa chọn gì."}</Typography.Text>
        {size && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Cỡ trên web: {sizeLabels[sizeFromCapacity(size.ml)]} ({size.ml}ml, {size.grams} g sáp
            {size.burnHours ? `, cháy ~${size.burnHours} giờ` : ""})
          </Typography.Text>
        )}
        {extra > 0 && (
          <>
            <Flex justify="space-between" gap={8}>
              <Typography.Text type="secondary">Giá theo Thủ công</Typography.Text>
              <Typography.Text className="tabular">{formatMoney(craft)}</Typography.Text>
            </Flex>
            <Flex justify="space-between" gap={8}>
              <Typography.Text type="secondary">Phụ kiện khác</Typography.Text>
              <Typography.Text className="tabular">{formatMoney(extra)}</Typography.Text>
            </Flex>
          </>
        )}
        <Flex justify="space-between" gap={8}>
          <Typography.Text type="secondary">{extra > 0 ? "Giá tham khảo" : "Giá theo Thủ công"}</Typography.Text>
          <Flex gap={8} align="center">
            <Typography.Text className="tabular">{formatMoney(reference)}</Typography.Text>
            {reference > 0 && (
              <Button size="small" type="link" style={{ padding: 0, height: "auto" }} onClick={() => form.setFieldsValue({ price: reference, salePrice: null })}>
                Dùng giá này
              </Button>
            )}
          </Flex>
        </Flex>
        <Flex justify="space-between" gap={8}>
          <Typography.Text type="secondary">Giá vốn nguyên liệu</Typography.Text>
          <Typography.Text className="tabular">{formatMoney(cost.cost)}</Typography.Text>
        </Flex>
        {cost.missing.length > 0 && (
          <Typography.Text type="warning" style={{ fontSize: 12 }}>
            Chưa có giá nhập: {cost.missing.map((m) => m.name).join(", ")}
          </Typography.Text>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
          Nguyên liệu cho 1 cây (trừ Kho)
        </Typography.Text>
        {recipe.length ? (
          <Flex vertical gap={4} role="list" aria-label="Công thức 1 cây">
            {recipe.map((r) => {
              const m = map.get(r.materialId);
              return (
                <Flex key={r.materialId} role="listitem" justify="space-between" gap={8} style={{ fontSize: 13 }}>
                  <Typography.Text ellipsis style={{ fontSize: 13 }}>
                    {m?.name ?? r.materialId}
                  </Typography.Text>
                  <Typography.Text type={m && m.stock < r.quantity ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                    {formatNumber(r.quantity)} / {formatNumber(m?.stock ?? 0)} {m ? unitLabel[m.unit] : ""}
                  </Typography.Text>
                </Flex>
              );
            })}
          </Flex>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Chưa có nguyên liệu theo dõi tồn.
          </Typography.Text>
        )}
        <div className="cfg-jars" data-tone={n === 0 ? "out" : n <= 5 ? "low" : "ok"} role="status">
          {!recipe.length || n === Infinity ? "Không giới hạn số cây" : n === 0 ? "Kho không đủ làm cây nào" : `Kho đủ làm ${formatNumber(n)} cây`}
        </div>
      </Flex>
    </FormSection>
  );
}

// Dưới ô giá: giá thực bán (giá giảm nếu có) so với giá vốn, gợi ý giá theo hệ số và lãi tối thiểu
export function PriceCheckLine() {
  const form = Form.useFormInstance();
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  const { settings } = useSettings();
  const map = useMemo(() => toMap(materials), [materials]);
  const values = (Form.useWatch("build", form) ?? {
    selection: {},
    extras: [],
  }) as BuildValues;
  const price = (Form.useWatch("price", form) as number | undefined) ?? 0;
  const salePrice = Form.useWatch("salePrice", form) as number | null | undefined;
  const recipe = recipeFromBuild(cleanBuild(values), config, map);
  if (!recipe.length) return null;
  const cost = needsCost(new Map(recipe.map((r) => [r.materialId, r.quantity])), map);
  const sell = salePrice || price;
  const check: PriceCheck = {
    price: sell,
    floor: cost.cost,
    missing: cost.missing,
    margin: sell > 0 ? (sell - cost.cost) / sell : null,
  };
  return (
    <div role="group" aria-label="Giá vốn 1 cây" style={{ marginTop: 12 }}>
      <CostCheck c={check} min={settings.minMargin} inline note={salePrice ? "so với giá giảm" : undefined}>
        {cost.cost > 0 && needsReview(check, settings.minMargin) && (
          <SuggestButton value={suggestPrice(cost.cost, settings)} current={sell} label="Gợi ý giá bán" onApply={(v) => form.setFieldsValue({ price: v, salePrice: null })} />
        )}
      </CostCheck>
    </div>
  );
}
