import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Checkbox, Col, ColorPicker, Drawer, Flex, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Select, Typography } from "antd";
import { useDeferredValue, useState } from "react";
import { MaterialPreview } from "@/components/craft/material-preview";
import { fromFormValues, NEW_MATERIAL, toFormValues, type OptionFormValues, type ResolvedMaterials } from "@/components/craft/option-form";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { ImageUpload } from "@/components/form/image-upload";
import { MaterialSelect } from "@/components/inventory/material-select";
import { MoneyInput } from "@/components/money-input";
import { DrawerFormSkeleton } from "@/components/skeletons";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { shapeLabels, sizeLabel, unitLabel, unitNames } from "@/lib/craft/groups";
import { DEFAULT_LOW_STOCK } from "@/lib/inventory/stock";
import type { Material, MaterialCategory } from "@/lib/inventory/types";
import { MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import { isOptionStep, previewRoleMeta, uniqueId } from "@/lib/craft/steps";
import { units, type CraftConfig, type OptionStep, type SizeOption, type StepOption, type Unit } from "@/lib/craft/types";

type Props = { open: boolean; step: OptionStep; option?: StepOption; config: CraftConfig; api: CraftConfigApi; materials: Material[]; onClose: () => void };

// Loại nguyên liệu gợi ý khi tạo mới từ bước (theo vai trò minh họa / component)
const suggestCategory = (step: OptionStep): MaterialCategory =>
  step.kind === "vessel" ? "vessel" : step.kind === "blend" ? "fragrance" : step.kind === "swatches" ? "dye" : "previewRole" in step && step.previewRole === "wick" ? "wick" : step.kind === "cards" && step.gramsPerGram ? "wax" : "other";

// Drawer thêm/sửa một lựa chọn: thẻ xem trước + các khối trường theo component của bước.
// Mount lại theo key mỗi lần mở nên form luôn bắt đầu từ dữ liệu mới.
export function OptionDrawer({ open, step, option, config, api, materials, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Drawer trượt ra ngay với khung xương; form (nặng) mount ngay sau ở chế độ ưu tiên thấp
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<OptionFormValues>();
  const materialId = Form.useWatch("materialId", form);
  const hasSwatch = Form.useWatch("hasSwatch", form);
  const hasImage = !!Form.useWatch("images", form)?.length;
  const [dirty, setDirty] = useState(false);
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
      // Mỗi cỡ một mã hũ (và nắp) riêng: "Hũ gốm 150ml", "Nắp hũ gốm 150ml"
      resolved.sizeMaterials = Object.fromEntries(
        (values.supportedSizeIds ?? []).map((sizeId) => {
          const ml = sizeLabel(step.sizes.find((x) => x.id === sizeId)!);
          const row = values.sizeStock?.[sizeId];
          const jar = pick(row?.jar, () => create(`jar ${en} ${ml}`, `${name} ${ml}`, "pcs", row?.jarStock, "vessel", swatch));
          const lid = values.hasLid ? pick(row?.lid, () => create(`lid ${en} ${ml}`, `Nắp ${name.toLowerCase()} ${ml}`, "pcs", row?.lidStock, "vessel")) : undefined;
          return [sizeId, { materialId: jar, lidMaterialId: lid }];
        }),
      );
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
          initialValues={toFormValues(step, option)}
          onFinish={finish}
          onValuesChange={() => setDirty(true)}
          scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
        >
          <Flex vertical gap={16}>
            <MaterialPreview materials={materials} groupLabel={step.title.vi} sizes={step.kind === "vessel" ? step.sizes : undefined} />

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

            <FormSection title="Giá & bán" description={step.kind === "blend" ? "Phụ thu tính theo tỉ lệ khách phối (vd 50% → một nửa phụ thu)." : "Phụ thu được cộng vào giá gốc theo kích thước."}>
              <Form.Item name="price" label="Phụ thu mỗi hũ">
                <MoneyInput />
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

            {step.kind === "vessel" && <VesselFields sizes={step.sizes} materials={materials} />}

            {looks && (
              <FormSection title="Ảnh minh họa" description={previewRoleMeta[role!].hint}>
                <Form.Item name="look" label="Kiểu hiển thị" style={{ marginBottom: 0 }}>
                  <Radio.Group optionType="button" options={[{ value: "", label: "Không" }, ...looks]} />
                </Form.Item>
              </FormSection>
            )}

            {step.kind === "blend" && (
              <FormSection title="Đặc tính">
                <SwitchField name="exclusive" label="Không phối thêm" description="Chọn mục này thì bỏ các mục khác (vd “Không mùi”)." last />
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

function VesselFields({ sizes, materials }: { sizes: SizeOption[]; materials: Material[] }) {
  const hasLid = Form.useWatch("hasLid");
  const supported: string[] = Form.useWatch("supportedSizeIds") ?? [];
  return (
    <>
      <FormSection title="Hũ & nắp" description="Dáng hũ (vẽ trong ảnh minh họa) và nắp khách chọn thêm.">
        <Form.Item name="shape" label="Dáng hũ">
          <Radio.Group optionType="button" options={Object.entries(shapeLabels).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        <SwitchField name="translucent" label="Hũ trong suốt" description="Ảnh minh họa sẽ thấy được màu sáp bên trong." />
        <SwitchField name="hasLid" label="Có nắp đi kèm" description="Nắp mỗi cỡ là một mã riêng trong Kho — chọn ở bảng bên dưới." last={!hasLid} />
        {hasLid && (
          <Form.Item name="lidPrice" label="Phụ thu nắp" style={{ marginTop: 16, marginBottom: 0 }}>
            <MoneyInput />
          </Form.Item>
        )}
      </FormSection>

      <FormSection
        title="Kích cỡ & tồn kho"
        description="Mỗi dung tích là một mã hũ riêng trong Kho. Khách chỉ đặt được cỡ còn hàng — hết hũ 200ml thì web chỉ khóa cỡ 200ml."
      >
        <Form.Item
          name="supportedSizeIds"
          rules={[{ required: true, type: "array", min: 1, message: "Chọn ít nhất một kích thước." }]}
          extra="Sửa danh sách kích thước ở tab Kích thước."
          style={{ marginBottom: 0 }}
        >
          <Checkbox.Group style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sizes.map((size) => (
              <SizeStockRow key={size.id} size={size} on={supported.includes(size.id)} hasLid={!!hasLid} materials={materials} />
            ))}
          </Checkbox.Group>
        </Form.Item>
      </FormSection>
    </>
  );
}

// Một cỡ của hũ: tích = hũ đổ được cỡ này; chọn mã hũ / nắp trong Kho hoặc tạo mới kèm tồn ban đầu
function SizeStockRow({ size, on, hasLid, materials }: { size: SizeOption; on: boolean; hasLid: boolean; materials: Material[] }) {
  const row = Form.useWatch(["sizeStock", size.id]);
  const label = sizeLabel(size);
  const field = (kind: "jar" | "lid", title: string) => (
    <Col xs={24} sm={hasLid ? 12 : 24}>
      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
        {title}
      </Typography.Text>
      <Flex gap={8}>
        <Form.Item name={["sizeStock", size.id, kind]} noStyle>
          <MaterialSelect materials={materials} allowCreate ariaLabel={`${title} ${label}`} style={{ flex: 1, minWidth: 0 }} />
        </Form.Item>
        {row?.[kind] === NEW_MATERIAL && (
          <Form.Item name={["sizeStock", size.id, `${kind}Stock`]} noStyle>
            <InputNumber min={0} precision={0} placeholder="Tồn" suffix={unitLabel.pcs} aria-label={`Tồn ban đầu · ${title} ${label}`} style={{ width: 104 }} />
          </Form.Item>
        )}
      </Flex>
    </Col>
  );
  return (
    <div style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 12, background: on ? "#fff" : "#fafaf8" }}>
      <Flex justify="space-between" align="center" gap={8}>
        <Checkbox value={size.id}>
          <Typography.Text strong>{label}</Typography.Text>
        </Checkbox>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {on ? `${size.grams}g sáp` : "Không đổ cỡ này"}
        </Typography.Text>
      </Flex>
      {on && (
        <Row gutter={[12, 12]} style={{ marginTop: 10 }}>
          {field("jar", "Hũ trong kho")}
          {hasLid && field("lid", "Nắp trong kho")}
        </Row>
      )}
    </div>
  );
}
