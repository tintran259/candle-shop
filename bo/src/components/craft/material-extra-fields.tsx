import { Checkbox, Col, Form, InputNumber, Radio, Row, Select } from "antd";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import { lookLabels, shapeLabels, type OptionGroup } from "@/lib/craft/groups";
import type { CustomizerCatalog } from "@/lib/craft/types";

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

// Khối trường riêng của từng nhóm nguyên liệu trong drawer
export function ExtraFields({ group, catalog }: { group: OptionGroup; catalog: CustomizerCatalog }) {
  const hasLid = Form.useWatch("hasLid");

  switch (group) {
    case "containers":
      return (
        <FormSection title="Hũ & nắp" description="Dáng hũ, kích thước đổ được và nắp đi kèm.">
          <Form.Item name="shape" label="Dáng hũ">
            <Radio.Group optionType="button" options={options(shapeLabels)} />
          </Form.Item>
          <Form.Item
            name="supportedSizeIds"
            label="Kích thước đổ được"
            extra="Khách chỉ chọn được các kích thước đã tích."
            rules={[{ required: true, type: "array", min: 1, message: "Chọn ít nhất một kích thước." }]}
          >
            <Checkbox.Group options={catalog.sizes.map((s) => ({ value: s.id, label: `${s.grams}g` }))} />
          </Form.Item>
          <SwitchField name="translucent" label="Hũ trong suốt" description="Ảnh minh họa sẽ thấy được màu sáp bên trong." />
          <SwitchField name="hasLid" label="Có nắp đi kèm" last={!hasLid} />
          {hasLid && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Form.Item name="lidPrice" label="Phụ thu nắp" style={{ marginBottom: 0 }}>
                  <MoneyInput />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lidStock" label="Tồn kho nắp" style={{ marginBottom: 0 }}>
                  <InputNumber min={0} precision={0} suffix="cái" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </FormSection>
      );
    case "wicks":
      return (
        <FormSection title="Tương thích" description="Giới hạn hũ, sáp và kích thước dùng được với bấc này.">
          <Form.Item name="containerIds" label="Dùng được với hũ" extra="Để trống = dùng được với mọi hũ.">
            <Select mode="multiple" allowClear placeholder="Tất cả hũ" options={catalog.containers.map((c) => ({ value: c.id, label: c.name.vi }))} />
          </Form.Item>
          <Form.Item name="waxIds" label="Dùng được với sáp" extra="Để trống = dùng được với mọi loại sáp.">
            <Select mode="multiple" allowClear placeholder="Tất cả loại sáp" options={catalog.waxes.map((w) => ({ value: w.id, label: w.name.vi }))} />
          </Form.Item>
          <Form.Item name="maxGrams" label="Khối lượng nến tối đa" extra="Để trống nếu không giới hạn." style={{ marginBottom: 0 }}>
            <InputNumber min={0} precision={0} suffix="g" placeholder="Không giới hạn" style={{ width: "100%" }} />
          </Form.Item>
        </FormSection>
      );
    case "fragrances":
      return (
        <FormSection title="Đặc tính">
          <SwitchField name="unscented" label="Lựa chọn “Không mùi”" description="Chọn mục này thì khách không phối thêm mùi khác." last />
        </FormSection>
      );
    case "colors":
      return (
        <FormSection title="Đặc tính">
          <SwitchField name="natural" label="Màu tự nhiên của sáp" description="Không pha màu nhuộm." last />
        </FormSection>
      );
    case "decorations":
      return (
        <FormSection title="An toàn & hiển thị">
          <SwitchField name="approved" label="Đã duyệt an toàn khi đốt" description="Chỉ mục đã duyệt mới hiện trên trang Thủ công." />
          <Form.Item name="look" label="Kiểu hiển thị trên ảnh minh họa" style={{ marginTop: 16, marginBottom: 0 }}>
            <Radio.Group optionType="button" options={[{ value: "none", label: "Không" }, ...options(lookLabels)]} />
          </Form.Item>
        </FormSection>
      );
    default:
      return null;
  }
}
