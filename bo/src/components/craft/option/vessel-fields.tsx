import { Checkbox, Col, Flex, Form, InputNumber, Radio, Row, Select, Typography } from "antd";
import { Link } from "react-router";
import { CostCheck, SuggestButton } from "@/components/craft/margin";
import { MaterialStock } from "@/components/craft/material-view";
import { rowDefaults, type SizeRow, type SizeValues } from "@/components/craft/option-form";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { MaterialSelect } from "@/components/inventory/material-select";
import { MoneyInput } from "@/components/money-input";
import { shapeLabels } from "@/lib/craft/groups";
import { needsReview, suggestPrice, type PriceCheck, type SizeCheck } from "@/lib/craft/pricing";
import { formatMoney } from "@/lib/format";
import { jarTypes, jarsOfType } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import type { ShopSettings } from "@/lib/settings/types";

type VesselProps = {
  rows: SizeRow[];
  isNew: boolean;
  materials: Material[];
  checks: Map<string, SizeCheck>;
  lid: PriceCheck | null;
  onLidPrice: (n: number) => void;
  pricing: Pick<ShopSettings, "minMargin" | "priceMarkup">;
  jarPrice: number;
  onPrice: (key: string, n: number) => void;
};

export function VesselFields({ rows, isNew, materials, checks, lid, onLidPrice, pricing, jarPrice, onPrice }: VesselProps) {
  const hasLid = Form.useWatch("hasLid");
  const jarType = Form.useWatch("jarType");
  const types = jarTypes(materials);
  // Nắp: mã trong nhóm Hũ & nắp không có loại hũ
  const lids = materials.filter((m) => m.category === "vessel" && !m.jarType);
  return (
    <>
      <FormSection title="Hũ & nắp" description="Dáng hũ (vẽ trong ảnh minh họa) và nắp khách chọn thêm.">
        <Form.Item name="shape" label="Dáng hũ">
          <Radio.Group optionType="button" options={Object.entries(shapeLabels).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        <SwitchField name="translucent" label="Hũ trong suốt" description="Ảnh minh họa sẽ thấy được màu sáp bên trong." />
        <SwitchField name="hasLid" label="Có nắp đi kèm" description="Nắp mỗi cỡ là một mã riêng trong Kho — chọn ở từng cỡ bên dưới." last={!hasLid} />
        {hasLid && (
          <>
            <Form.Item name="lidPrice" label="Phụ thu nắp" style={{ marginTop: 16, marginBottom: 0 }}>
              <MoneyInput aria-label="Phụ thu nắp" />
            </Form.Item>
            {/* So với nắp đắt nhất trong các cỡ đang bán; nắp chọn ở từng cỡ bên dưới */}
            {lid && (
              <div role="group" aria-label="Giá vốn nắp" style={{ marginTop: 6 }}>
                <CostCheck c={lid} min={pricing.minMargin} inline note={lid.size && `nắp cỡ ${lid.size.ml}ml`}>
                  {lid.floor > 0 && needsReview(lid, pricing.minMargin) && (
                    <SuggestButton value={suggestPrice(lid.floor, pricing)} current={lid.price} label="Gợi ý phụ thu nắp" onApply={onLidPrice} />
                  )}
                </CostCheck>
              </div>
            )}
          </>
        )}
      </FormSection>

      <FormSection title="Loại hũ & kích thước" description="Các cỡ lấy từ Kho: mỗi mã hũ cùng Loại hũ là một cỡ. Giá khách trả = giá hũ + phụ thu cỡ. Hết hũ cỡ nào thì web chỉ khóa cỡ đó.">
        <Form.Item
          name="jarType"
          label="Loại hũ trong Kho"
          rules={[{ required: true, message: "Chọn loại hũ trong Kho." }]}
          extra={
            types.length ? undefined : (
              <>
                Kho chưa có hũ nào có Loại hũ. <Link to="/inventory">Thêm ở Kho nguyên liệu</Link>: loại Hũ & nắp, điền Loại hũ và Dung tích.
              </>
            )
          }
        >
          <Select showSearch placeholder="VD: Hũ thạch cao" aria-label="Loại hũ trong Kho" options={types.map((t) => ({ value: t, label: `${t} · ${jarsOfType(materials, t).length} cỡ` }))} />
        </Form.Item>
        <Flex vertical gap={8}>
          {rows.map((row) => (
            <SizeRowFields
              key={row.key}
              row={row}
              isNew={isNew}
              hasLid={!!hasLid}
              materials={materials}
              lids={lids}
              check={checks.get(row.key)}
              pricing={pricing}
              jarPrice={jarPrice}
              onPrice={onPrice}
            />
          ))}
          {jarType && !rows.length && <Typography.Text type="secondary">Loại hũ này chưa có mã hũ nào trong Kho.</Typography.Text>}
          {jarType && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Thêm cỡ: tạo hũ cùng Loại hũ “{jarType}” với dung tích mới ở <Link to="/inventory">Kho nguyên liệu</Link>, mở lại hũ này là thấy.
            </Typography.Text>
          )}
        </Flex>
      </FormSection>
    </>
  );
}

type RowProps = Omit<VesselProps, "rows" | "checks" | "lid" | "onLidPrice"> & { row: SizeRow; hasLid: boolean; lids: Material[]; check?: SizeCheck };

// Một cỡ của hũ: bán hay không, phụ thu cỡ, sáp đổ, giờ cháy, nắp; kèm giá khách trả so với giá vốn
function SizeRowFields({ row, isNew, hasLid, materials, lids, check, pricing, jarPrice, onPrice }: RowProps) {
  const def = rowDefaults(row, isNew);
  const v = { ...def, ...(Form.useWatch(["sizes", row.key]) as SizeValues | undefined) };
  const label = `${row.ml}ml`;
  const jar = row.materialId ? materials.find((m) => m.id === row.materialId) : undefined;
  const name = (field: keyof SizeValues) => ["sizes", row.key, field];
  return (
    <div role="group" aria-label={`Cỡ ${label}`} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 12, background: v.on ? "#fff" : "#fafaf8" }}>
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Form.Item name={name("on")} valuePropName="checked" initialValue={def.on} noStyle>
          <Checkbox aria-label={`Bán cỡ ${label}`}>
            <Typography.Text strong>{label}</Typography.Text>
            {!row.existing && (
              <Typography.Text type="warning" style={{ fontSize: 12, marginLeft: 6 }}>
                mới trong Kho
              </Typography.Text>
            )}
          </Checkbox>
        </Form.Item>
        {jar ? (
          <Flex gap={6} align="center">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {jar.name}
            </Typography.Text>
            <MaterialStock material={jar} />
          </Flex>
        ) : (
          <Typography.Text type={row.materialId ? "danger" : "secondary"} style={{ fontSize: 12 }}>
            {row.materialId ? "Mã hũ đã xóa khỏi Kho" : "Không theo dõi tồn"}
          </Typography.Text>
        )}
      </Flex>
      {v.on && (
        <>
          <Row gutter={[12, 0]} style={{ marginTop: 10 }}>
            <Col xs={12} sm={hasLid ? 6 : 8}>
              <Form.Item name={name("price")} label="Phụ thu cỡ" initialValue={def.price} style={{ marginBottom: 8 }}>
                <MoneyInput aria-label={`Phụ thu cỡ ${label}`} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={hasLid ? 6 : 8}>
              <Form.Item name={name("grams")} label="Sáp đổ" initialValue={def.grams} style={{ marginBottom: 8 }}>
                <InputNumber min={0} precision={0} suffix="g" aria-label={`Sáp đổ ${label}`} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={hasLid ? 5 : 8}>
              <Form.Item name={name("burnHours")} label="Cháy (giờ)" initialValue={def.burnHours} style={{ marginBottom: 8 }}>
                <InputNumber min={0} precision={0} placeholder="Chưa đo" aria-label={`Thời gian cháy ${label}`} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            {hasLid && (
              <Col xs={12} sm={7}>
                <Form.Item name={name("lid")} label="Nắp" initialValue={def.lid} style={{ marginBottom: 8 }}>
                  <MaterialSelect materials={lids} ariaLabel={`Nắp ${label}`} />
                </Form.Item>
              </Col>
            )}
          </Row>
          {check && (
            <Flex gap={8} wrap align="center" role="group" aria-label={`Giá vốn ${label}`} title={check.parts.map((p) => `${p.step}: ${p.name} ${formatMoney(p.cost)}`).join(" · ")}>
              <Typography.Text className="tabular" style={{ fontSize: 13 }}>
                Khách trả {formatMoney(check.price)} ·
              </Typography.Text>
              <CostCheck c={check} min={pricing.minMargin} inline>
                {check.floor > 0 && needsReview(check, pricing.minMargin) && (
                  <SuggestButton
                    // Phụ thu cỡ gợi ý = giá gợi ý cả hũ − giá hũ
                    value={Math.max(0, suggestPrice(check.floor, pricing) - jarPrice)}
                    current={Math.round(v.price ?? 0)}
                    label={`Gợi ý phụ thu cỡ ${label}`}
                    onApply={(n) => onPrice(row.key, n)}
                  />
                )}
              </CostCheck>
            </Flex>
          )}
        </>
      )}
    </div>
  );
}
