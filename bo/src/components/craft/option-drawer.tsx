import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Checkbox, Col, ColorPicker, Drawer, Flex, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Select, Typography } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import { CostCheck, SuggestButton } from "@/components/craft/margin";
import { MaterialPreview } from "@/components/craft/material-preview";
import { MaterialStock } from "@/components/craft/material-view";
import {
  fromFormValues,
  NEW_MATERIAL,
  rowDefaults,
  sizesFromForm,
  toFormValues,
  vesselRows,
  type OptionFormValues,
  type ResolvedMaterials,
  type SizeRow,
  type SizeValues,
} from "@/components/craft/option-form";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { ImageUpload } from "@/components/form/image-upload";
import { MaterialSelect } from "@/components/inventory/material-select";
import { MoneyInput } from "@/components/money-input";
import { DrawerFormSkeleton } from "@/components/skeletons";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { shapeLabels, sizeLabel, unitNames } from "@/lib/craft/groups";
import { needsReview, optionCheck, suggestPrice, suggestUnitPrice, vesselSizeChecks, type SizeCheck } from "@/lib/craft/pricing";
import { stepAmounts, vesselStep } from "@/lib/craft/selection";
import { formatMoney } from "@/lib/format";
import { DEFAULT_LOW_STOCK, jarTypes, jarsOfType, toMap } from "@/lib/inventory/stock";
import type { Material, MaterialCategory } from "@/lib/inventory/types";
import { MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import { amountBasis, basisLabel, isOptionStep, previewRoleMeta, uniqueId } from "@/lib/craft/steps";
import { units, type CraftConfig, type OptionStep, type StepOption, type Unit, type VesselOption } from "@/lib/craft/types";
import type { ShopSettings } from "@/lib/settings/types";

type Props = {
  open: boolean;
  step: OptionStep;
  option?: StepOption;
  config: CraftConfig;
  api: CraftConfigApi;
  materials: Material[];
  pricing: Pick<ShopSettings, "minMargin" | "priceMarkup">;
  onClose: () => void;
};

// Loại nguyên liệu gợi ý khi tạo mới từ bước (theo vai trò minh họa / component)
const suggestCategory = (step: OptionStep): MaterialCategory =>
  step.kind === "vessel" ? "vessel" : step.kind === "blend" ? "fragrance" : step.kind === "swatches" ? "dye" : "previewRole" in step && step.previewRole === "wick" ? "wick" : step.kind === "cards" && step.gramsPerGram ? "wax" : "other";

// Drawer thêm/sửa một lựa chọn: thẻ xem trước + các khối trường theo component của bước.
// Mount lại theo key mỗi lần mở nên form luôn bắt đầu từ dữ liệu mới.
export function OptionDrawer({ open, step, option, config, api, materials, pricing, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Drawer trượt ra ngay với khung xương; form (nặng) mount ngay sau ở chế độ ưu tiên thấp
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<OptionFormValues>();
  const materialId = Form.useWatch("materialId", form);
  const hasSwatch = Form.useWatch("hasSwatch", form);
  const hasImage = !!Form.useWatch("images", form)?.length;
  const [dirty, setDirty] = useState(false);
  const price = Form.useWatch("price", form);
  const isVessel = step.kind === "vessel";
  // Sáp, màu, hương: giá bán mỗi 100 g / mỗi ml, khách trả theo lượng dùng cho hũ
  const basis = amountBasis(step);
  const perLabel = basis && basisLabel(basis);
  const priceLabel = isVessel ? "Giá hũ" : perLabel ? `Giá bán / ${perLabel}` : "Phụ thu mỗi hũ";
  const jarType = Form.useWatch("jarType", form);
  const hasLid = Form.useWatch("hasLid", form);
  const sizeValues = Form.useWatch("sizes", form) as Record<string, SizeValues> | undefined;
  const map = useMemo(() => toMap(materials), [materials]);
  // Hũ: các cỡ theo loại hũ đang chọn (cỡ đã có + mã hũ cùng loại trong Kho)
  const rows = useMemo(() => (isVessel ? vesselRows(option as VesselOption | undefined, jarType, materials) : []), [isVessel, option, jarType, materials]);
  // Giá vốn tối thiểu theo giá và nguyên liệu đang nhập (chưa cần Áp dụng)
  const priceCheck = useMemo(() => {
    if (isVessel) return null;
    const draft = {
      ...(option ?? { id: "__draft", name: { vi: "", en: "" }, available: true }),
      ...(basis ? { priceDelta: 0, unitPrice: Math.round(price ?? 0) } : { priceDelta: Math.round(price ?? option?.priceDelta ?? 0) }),
      materialId: materialId && materialId !== NEW_MATERIAL ? materialId : undefined,
    } as StepOption;
    return optionCheck(config, step, draft, map);
  }, [isVessel, basis, step, option, price, materialId, config, map]);
  // Ví dụ giá theo lượng ở cỡ hũ nhỏ nhất đang bán: "120 g × 18.000 ₫/100 g = 21.600 ₫"
  const sample = useMemo(() => {
    if (!basis) return null;
    const sizes = (vesselStep(config)?.options ?? []).filter((v) => v.available).flatMap((v) => v.sizes.filter((s) => s.available).map((s) => ({ v, s })));
    const first = sizes.sort((a, b) => a.s.grams - b.s.grams)[0];
    if (!first) return null;
    const sel = step.kind === "blend" ? { kind: "blend" as const, items: [{ optionId: "x", weight: 1 }], intensity: step.intensity ? ("medium" as const) : null } : { kind: step.kind as "cards", optionIds: ["x"] };
    const amount = stepAmounts(step, sel, first.s.grams).get("x") ?? 0;
    return { jar: `${first.v.name.vi} ${first.s.ml}ml`, grams: first.s.grams, amount: Math.round(amount * 10) / 10 };
  }, [basis, config, step]);
  const sizeChecks = useMemo(() => {
    if (!isVessel) return new Map<string, SizeCheck>();
    const draft = {
      ...(option ?? { id: "__draft", name: { vi: "", en: "" }, available: true, shape: "jar", lid: null }),
      priceDelta: Math.round(price ?? option?.priceDelta ?? 0),
      sizes: sizesFromForm(rows, sizeValues, !!hasLid, !option),
    } as VesselOption;
    return vesselSizeChecks(config, step, draft, map);
  }, [isVessel, step, option, price, rows, sizeValues, hasLid, config, map]);
  const role = step.kind === "cards" || step.kind === "swatches" ? step.previewRole : undefined;
  const looks = role ? previewRoleMeta[role].looks : undefined;
  // Bước khác có lựa chọn — để đặt quy tắc "chỉ dùng với"
  const others = config.steps.filter((s) => s.id !== step.id && isOptionStep(s)) as OptionStep[];

  const requestClose = () => {
    if (!dirty) return onClose();
    modal.confirm({
      title: "Bỏ các thay đổi chưa lưu?",
      content: "Những gì bạn vừa sửa sẽ không được lưu lại.",
      okText: "Bỏ thay đổi",
      okButtonProps: { danger: true },
      cancelText: "Tiếp tục sửa",
      onOk: onClose,
    });
  };

  const finish = (values: OptionFormValues) => {
    // Chọn "Tạo mới" thì tạo nguyên liệu trong bản nháp (tồn ban đầu admin nhập), lựa chọn trỏ tới id đó.
    // Nguyên liệu chỉ thật sự vào Kho khi bấm Lưu trên trang — Bỏ thay đổi thì không sót lại gì.
    const name = values.nameVi.trim();
    const en = values.nameEn?.trim() || name;
    const taken = materials.map((m) => m.id);
    const create = (key: string, materialName: string, unit: Unit, stock: number | undefined, category: MaterialCategory, swatch?: string) => {
      const id = uniqueId(key, taken, "material");
      taken.push(id);
      api.addPendingMaterial({ id, name: materialName, category, unit, tracked: true, stock: Math.max(0, Math.round(stock ?? 0)), lowStock: DEFAULT_LOW_STOCK[unit], swatch });
      return id;
    };
    const pick = (value: string | undefined, make: () => string) => (value === NEW_MATERIAL ? make() : value || undefined);
    const swatch = values.hasSwatch ? values.swatch : undefined;

    const resolved: ResolvedMaterials = {};
    if (step.kind === "vessel") {
      // Mỗi cỡ là một mã hũ cùng Loại hũ trong Kho
      resolved.sizes = sizesFromForm(rows, values.sizes, !!values.hasLid, !option);
    } else {
      resolved.materialId = pick(values.materialId, () => create(`${step.id} ${en}`, name, values.newUnit ?? "pcs", values.newStock, suggestCategory(step), swatch));
    }
    const next = fromFormValues(step, values, resolved, option);
    if (!api.saveOption(step.id, next, option?.id)) return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    const created = taken.length - materials.length;
    message.success(`${option ? "Đã cập nhật" : "Đã thêm"} ${next.name.vi}${created ? ` (+${created} nguyên liệu mới, vào Kho khi Lưu)` : ""} — bấm “Lưu thay đổi” để lên web.`);
    onClose();
  };

  const remove = () => {
    if (!option) return;
    api.removeOption(step.id, option.id);
    message.success(`Đã xóa ${option.name.vi}`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      title={option ? `Sửa lựa chọn · ${step.title.vi}` : `Thêm lựa chọn · ${step.title.vi}`}
      size={screens.sm === false ? "100%" : 640}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {option && (
            <Popconfirm
              title={`Xóa “${option.name.vi}”?`}
              description="Khách sẽ không chọn được mục này nữa."
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={remove}
            >
              <Button danger type="text" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
          {dirty && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Có thay đổi chưa lưu
            </Typography.Text>
          )}
          <Button onClick={requestClose} style={{ marginLeft: "auto" }}>
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()}>
            {option ? "Áp dụng" : "Thêm lựa chọn"}
          </Button>
        </Flex>
      }
    >
      {ready ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={toFormValues(step, option, materials)}
          onFinish={finish}
          onValuesChange={() => setDirty(true)}
          scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
        >
          <Flex vertical gap={16}>
            <MaterialPreview materials={materials} groupLabel={step.title.vi} rows={isVessel ? rows : undefined} priceLabel={priceLabel} />

            <FormSection title="Thông tin cơ bản" description="Tên và mô tả khách thấy ở bước này.">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="nameVi" label="Tên (Tiếng Việt)" rules={[{ required: true, whitespace: true, message: "Nhập tên tiếng Việt." }]}>
                    <Input autoFocus placeholder="VD: Sáp đậu nành" maxLength={40} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="nameEn" label="Tên (English)" extra="Để trống sẽ dùng tên tiếng Việt.">
                    <Input placeholder="VD: Soy wax" maxLength={40} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="descVi" label="Mô tả ngắn (VI)" style={{ marginBottom: screens.sm === false ? undefined : 0 }}>
                    <Input placeholder="VD: Cháy sạch, ít khói" maxLength={80} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="descEn" label="Mô tả ngắn (EN)" style={{ marginBottom: 0 }}>
                    <Input placeholder="VD: Clean, low-soot burn" maxLength={80} />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            <FormSection
              title="Giá & bán"
              description={
                isVessel
                  ? "Giá hũ ở cỡ nhỏ nhất. Mỗi cỡ cộng phụ thu cỡ riêng ở phần Loại hũ & kích thước bên dưới."
                  : basis
                    ? `Khách trả = lượng dùng cho hũ đã chọn × giá này, làm tròn tới 100 ₫. Chọn nhiều thì chia theo % lượng.${
                        sample ? ` Vd ${sample.jar} (${sample.grams} g sáp): ${sample.amount.toLocaleString("vi-VN")} ${basis.unit} × ${formatMoney(Math.round(price ?? 0))}/${perLabel} = ${formatMoney(Math.round((sample.amount * Math.round(price ?? 0)) / basis.per / 100) * 100)}.` : ""
                      }`
                    : "Phụ thu được cộng vào giá hũ."
              }
            >
              <Form.Item
                name="price"
                label={priceLabel}
                extra={
                  priceCheck && (
                    <div role="group" aria-label="Giá vốn lựa chọn">
                      <CostCheck
                        c={priceCheck}
                        min={pricing.minMargin}
                        inline
                        note={priceCheck.floor > 0 && priceCheck.size ? `cỡ ${sizeLabel(priceCheck.size)}` : undefined}
                        free={priceCheck.isDefault ? "Tính trong giá hũ" : undefined}
                      >
                        {priceCheck.floor > 0 && needsReview(priceCheck, pricing.minMargin) && (
                          <SuggestButton
                            // Giá theo lượng: gợi ý giá mỗi 100 g / mỗi ml. Phụ thu: giá gợi ý − phần khách đã trả thêm ngoài phụ thu
                            value={basis ? suggestUnitPrice(priceCheck.floor, pricing) : Math.max(0, suggestPrice(priceCheck.floor, pricing) - (priceCheck.price - Math.round(price ?? 0)))}
                            current={Math.round(price ?? 0)}
                            label={basis ? "Gợi ý giá bán" : "Gợi ý phụ thu"}
                            onApply={(n) => {
                              form.setFieldValue("price", n);
                              setDirty(true);
                            }}
                          />
                        )}
                      </CostCheck>
                    </div>
                  )
                }
              >
                <MoneyInput aria-label={priceLabel} />
              </Form.Item>
              <SwitchField name="available" label="Đang bán" description="Tắt để tạm ẩn với khách dù vẫn còn hàng." last />
            </FormSection>

            {step.kind !== "vessel" && (
            <FormSection title="Nguyên liệu trong kho" description="Tồn kho quản lý ở trang Kho nguyên liệu. Khách chọn mục này thì kho trừ nguyên liệu bên dưới; hết hàng thì web tự khóa lựa chọn.">
              <Form.Item name="materialId" label="Nguyên liệu" style={{ marginBottom: materialId === NEW_MATERIAL ? undefined : 0 }}>
                <MaterialSelect materials={materials} allowCreate />
              </Form.Item>
              {materialId === NEW_MATERIAL && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="newUnit" label="Tính theo" style={{ marginBottom: 0 }}>
                      <Radio.Group optionType="button" options={units.map((u) => ({ value: u, label: unitNames[u] }))} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="newStock" label="Tồn ban đầu" extra="Tạo trong Kho cùng tên lựa chọn." style={{ marginBottom: 0 }}>
                      <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </FormSection>
            )}

            <FormSection title="Hình ảnh & màu" description={`Tối đa ${MAX_IMAGES} ảnh, mỗi ảnh ≤ ${MAX_FILE_MB}MB. Không có ảnh thì web dùng màu.`}>
              <Form.Item name="images" noStyle>
                <ImageUpload />
              </Form.Item>
              <Flex justify="space-between" align="center" gap={16} style={{ marginTop: 16 }}>
                <Flex vertical>
                  <Typography.Text strong>Màu hiển thị</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {/* Có ảnh thì thẻ / ô màu trên web hiện ảnh; màu chỉ còn dùng để tô ảnh minh họa cây nến */}
                    {role === "waxColor"
                      ? hasImage
                        ? "Web hiện ảnh trên thẻ; màu này dùng để tô phần sáp trong ảnh minh họa."
                        : "Tô lên phần sáp trong ảnh minh họa."
                      : hasImage
                        ? "Đang có ảnh — web hiện ảnh, màu chỉ dùng khi xóa hết ảnh."
                        : step.kind === "swatches"
                          ? "Tắt = “không pha màu” (ô sọc)."
                          : "Dùng khi chưa có ảnh."}
                  </Typography.Text>
                </Flex>
                <Flex gap={8} align="center">
                  {hasSwatch && (
                    <Form.Item name="swatch" noStyle getValueFromEvent={(color) => color.toHexString()}>
                      <ColorPicker showText disabledAlpha aria-label="Màu hiển thị" />
                    </Form.Item>
                  )}
                  <Form.Item name="hasSwatch" noStyle valuePropName="checked">
                    <Checkbox>Có màu</Checkbox>
                  </Form.Item>
                </Flex>
              </Flex>
            </FormSection>

            {isVessel && (
              <VesselFields
                rows={rows}
                isNew={!option}
                materials={materials}
                checks={sizeChecks}
                pricing={pricing}
                jarPrice={Math.round(price ?? 0)}
                onPrice={(key, n) => {
                  form.setFieldValue(["sizes", key, "price"], n);
                  setDirty(true);
                }}
              />
            )}

            {looks && (
              <FormSection title="Ảnh minh họa" description={previewRoleMeta[role!].hint}>
                <Form.Item name="look" label="Kiểu hiển thị" style={{ marginBottom: 0 }}>
                  <Radio.Group optionType="button" options={[{ value: "", label: "Không" }, ...looks]} />
                </Form.Item>
              </FormSection>
            )}

            {step.kind !== "vessel" && (
              <FormSection title="Đặc tính">
                <SwitchField name="exclusive" label="Đứng một mình" description="Chọn mục này thì bỏ các mục khác (vd “Không mùi”, “Không màu”)." last />
              </FormSection>
            )}

            {step.kind !== "vessel" && (
              <FormSection title="Tương thích" description="Chỉ cho chọn khi các bước khác đang chọn đúng mục. Để trống = dùng được với tất cả.">
                {others.map((s) => (
                  <Form.Item key={s.id} name={["onlyWith", s.id]} label={`Chỉ dùng với ${s.title.vi.toLowerCase()}`}>
                    <Select mode="multiple" allowClear placeholder="Tất cả" options={(s.options as StepOption[]).map((o) => ({ value: o.id, label: o.name.vi }))} />
                  </Form.Item>
                ))}
                <Form.Item name="maxGrams" label="Lượng sáp tối đa" extra="Theo lượng sáp đổ của cỡ hũ. Để trống nếu không giới hạn." style={{ marginBottom: 0 }}>
                  <InputNumber min={0} precision={0} suffix="g" placeholder="Không giới hạn" style={{ width: "100%" }} />
                </Form.Item>
              </FormSection>
            )}
          </Flex>
        </Form>
      ) : (
        <DrawerFormSkeleton />
      )}
    </Drawer>
  );
}

type VesselProps = {
  rows: SizeRow[];
  isNew: boolean;
  materials: Material[];
  checks: Map<string, SizeCheck>;
  pricing: Pick<ShopSettings, "minMargin" | "priceMarkup">;
  jarPrice: number;
  onPrice: (key: string, n: number) => void;
};

function VesselFields({ rows, isNew, materials, checks, pricing, jarPrice, onPrice }: VesselProps) {
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
          <Form.Item name="lidPrice" label="Phụ thu nắp" style={{ marginTop: 16, marginBottom: 0 }}>
            <MoneyInput />
          </Form.Item>
        )}
      </FormSection>

      <FormSection
        title="Loại hũ & kích thước"
        description="Các cỡ lấy từ Kho: mỗi mã hũ cùng Loại hũ là một cỡ. Giá khách trả = giá hũ + phụ thu cỡ. Hết hũ cỡ nào thì web chỉ khóa cỡ đó."
      >
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
          <Select
            showSearch
            placeholder="VD: Hũ thạch cao"
            aria-label="Loại hũ trong Kho"
            options={types.map((t) => ({ value: t, label: `${t} · ${jarsOfType(materials, t).length} cỡ` }))}
          />
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

type RowProps = Omit<VesselProps, "rows" | "checks"> & { row: SizeRow; hasLid: boolean; lids: Material[]; check?: SizeCheck };

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
