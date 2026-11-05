import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Empty, Flex, Form, InputNumber, Row, Typography } from "antd";
import { useMemo } from "react";
import { Link } from "react-router";
import { CostCheck, SuggestButton } from "@/components/craft/margin";
import { FormSection } from "@/components/form/form-section";
import { MaterialSelect } from "@/components/inventory/material-select";
import { CraftStepSections } from "@/components/orders/craft-step-sections";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import { needsCost } from "@/lib/costs";
import { needsReview, suggestPrice, type PriceCheck } from "@/lib/craft/pricing";
import { type CraftSelection } from "@/lib/craft/selection";
import { unitLabel } from "@/lib/craft/groups";
import { formatNumber } from "@/lib/format";
import { toMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { buildIssues, productSteps } from "@/lib/products/build";

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
