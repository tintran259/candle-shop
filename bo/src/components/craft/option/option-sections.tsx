import { Checkbox, Col, ColorPicker, Flex, Form, Grid, Input, InputNumber, Radio, Row, Select, Typography, type FormRule } from "antd";
import { NEW_MATERIAL } from "@/components/craft/option-form";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { ImageUpload } from "@/components/form/image-upload";
import { MaterialSelect } from "@/components/inventory/material-select";
import { LotPriceInput } from "@/components/inventory/price-inputs";
import { lotTotal, unitPrice, type LotPrice } from "@/lib/costs";
import { formatUnitCost } from "@/lib/format";
import { unitLabel } from "@/lib/craft/groups";
import { lotPriceRequired } from "@/lib/inventory/stock";
import { unitNames } from "@/lib/craft/groups";
import type { Material } from "@/lib/inventory/types";
import { MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import { previewRoleMeta } from "@/lib/craft/steps";
import { units, type OptionStep, type StepOption } from "@/lib/craft/types";

// Thông tin cơ bản: tên, mô tả hai thứ tiếng
export function BasicFields() {
  const screens = Grid.useBreakpoint();
  return (
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
  );
}

// Giống tạo nguyên liệu ở Kho: có tồn ban đầu thì bắt buộc tiền đã trả (hoặc Không mất tiền); ghi tiền mà tồn 0 thì không chia ra được giá
const openingRule: FormRule = ({ getFieldValue }) => ({
  validator: (_, v?: LotPrice) => {
    const stock = getFieldValue("newStock") ?? 0;
    if (stock > 0 && lotTotal(v) === undefined) return Promise.reject(new Error(lotPriceRequired));
    if (!stock && v?.total && !v.free) return Promise.reject(new Error("Nhập tồn ban đầu để chia ra giá mỗi đơn vị."));
    return Promise.resolve();
  },
});

// Nguyên liệu trong kho của lựa chọn (không phải hũ); chọn Tạo mới thì nhập đơn vị, tồn ban đầu và tiền đã trả cho số tồn đó
export function MaterialFields({ materials, materialId }: { materials: Material[]; materialId?: string }) {
  const stock = Form.useWatch("newStock") as number | undefined;
  const unit = (Form.useWatch("newUnit") as keyof typeof unitLabel | undefined) ?? "pcs";
  const opening = Form.useWatch("newOpening") as LotPrice | undefined;
  const total = lotTotal(opening);
  const price = stock && total !== undefined ? unitPrice(total, stock) : undefined;
  return (
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
              <InputNumber min={0} precision={0} suffix={unitLabel[unit]} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="newOpening"
              label="Tổng tiền đã trả"
              required={!!stock}
              rules={[openingRule]}
              // Chỉ kiểm tra khi bấm lưu lựa chọn (gõ tiền trước số tồn không bị báo đỏ giữa chừng)
              validateTrigger={false}
              extra={
                price !== undefined
                  ? `= ${formatUnitCost(price)}/${unitLabel[unit]} — giá nhập ban đầu, dùng tính giá vốn.`
                  : stock
                    ? "Tiền mua số tồn ban đầu, hệ thống tự chia ra giá mỗi đơn vị."
                    : "Chưa có hàng thì để trống — giá có từ phiếu Nhập thêm đầu tiên ở Kho."
              }
              style={{ margin: "16px 0 0" }}
            >
              <LotPriceInput label="Tổng tiền đã trả" />
            </Form.Item>
          </Col>
        </Row>
      )}
    </FormSection>
  );
}

// Hình ảnh và màu hiển thị trên web
export function ImageFields({ step, role, hasImage, hasSwatch }: { step: OptionStep; role?: string; hasImage: boolean; hasSwatch?: boolean }) {
  return (
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
  );
}

// Ảnh minh họa theo vai trò của bước
export function LookFields({ role, looks }: { role: keyof typeof previewRoleMeta; looks: { value: string; label: string }[] }) {
  return (
    <FormSection title="Ảnh minh họa" description={previewRoleMeta[role].hint}>
      <Form.Item name="look" label="Kiểu hiển thị" style={{ marginBottom: 0 }}>
        <Radio.Group optionType="button" options={[{ value: "", label: "Không" }, ...looks]} />
      </Form.Item>
    </FormSection>
  );
}

// Đặc tính và tương thích với lựa chọn ở bước khác
export function RuleFields({ others }: { others: OptionStep[] }) {
  return (
    <>
      <FormSection title="Đặc tính">
        <SwitchField name="exclusive" label="Đứng một mình" description="Chọn mục này thì bỏ các mục khác (vd “Không mùi”, “Không màu”)." last />
      </FormSection>
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
    </>
  );
}
