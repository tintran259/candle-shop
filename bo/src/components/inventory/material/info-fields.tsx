import { AutoComplete, Col, ColorPicker, Flex, Form, Input, InputNumber, Radio, Row, Segmented, Select, Typography } from "antd";
import { FormSection } from "@/components/form/form-section";
import { ImageUpload } from "@/components/form/image-upload";
import { SourceChoice } from "@/components/inventory/material/parts";
import { unitNames } from "@/lib/craft/groups";
import { MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import { units } from "@/lib/craft/types";
import { categoryLabels, jarTypes, type Usage } from "@/lib/inventory/stock";
import { materialCategories, type Material, type MaterialCategory } from "@/lib/inventory/types";
import { fold } from "@/lib/search";

type Props = { material?: Material; materials: Material[]; usage: Usage[]; category?: MaterialCategory; hasSwatch?: boolean };

// Khối Thông tin: nguồn (mua / sản xuất), tên, mã, loại, loại hũ + dung tích, đơn vị, màu nhận diện
export function InfoFields({ material, materials, usage, category, hasSwatch }: Props) {
  return (
    <FormSection title="Thông tin" description="Tên nội bộ của xưởng — khách không thấy (khách thấy tên lựa chọn trên trang Thủ công).">
      <Form.Item name="source" label="Nguồn">
        <SourceChoice />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={14}>
          <Form.Item name="name" label="Tên nguyên liệu" rules={[{ required: true, whitespace: true, message: "Nhập tên." }]}>
            <Input autoFocus={!material} maxLength={60} placeholder="VD: Sáp đậu nành" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={10}>
          <Form.Item name="sku" label="Mã nội bộ / NCC">
            <Input maxLength={30} placeholder="VD: SAP-DN" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="category" label="Loại">
            <Select options={materialCategories.map((c) => ({ value: c, label: categoryLabels[c] }))} />
          </Form.Item>
        </Col>
        {category === "vessel" && (
          <>
            <Col xs={24} sm={14}>
              <Form.Item name="jarType" label="Loại hũ" extra="Các mã cùng loại hũ là các cỡ của một hũ ở trang Thủ công. Nắp để trống.">
                <AutoComplete
                  options={jarTypes(materials).map((t) => ({ value: t }))}
                  filterOption={(input, o) => fold(String(o?.value ?? "")).includes(fold(input))}
                  placeholder="VD: Hũ thạch cao"
                  aria-label="Loại hũ"
                  maxLength={40}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item
                name="capacity"
                label="Dung tích"
                dependencies={["jarType"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: async (_, v?: number | null) => {
                      if (getFieldValue("jarType")?.trim() && !v) throw new Error("Nhập dung tích của hũ.");
                    },
                  }),
                ]}
              >
                <InputNumber min={1} precision={0} suffix="ml" placeholder="VD: 150" aria-label="Dung tích" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </>
        )}
        <Col xs={24} sm={12}>
          <Form.Item name="unit" label="Tính theo" extra={material && usage.length ? "Đổi đơn vị sẽ đổi cách trừ kho của các lựa chọn đang dùng." : undefined}>
            <Radio.Group optionType="button" options={units.map((u) => ({ value: u, label: unitNames[u] }))} />
          </Form.Item>
        </Col>
      </Row>
      <Flex justify="space-between" align="center" gap={16}>
        <Flex vertical>
          <Typography.Text strong>Màu nhận diện</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Hiện trong bảng kho cho dễ nhìn.
          </Typography.Text>
        </Flex>
        <Flex gap={8} align="center">
          {hasSwatch && (
            <Form.Item name="swatch" noStyle getValueFromEvent={(c) => c.toHexString()}>
              <ColorPicker showText disabledAlpha aria-label="Màu nhận diện" />
            </Form.Item>
          )}
          <Form.Item name="hasSwatch" noStyle>
            <Segmented
              options={[
                { value: false, label: "Không" },
                { value: true, label: "Có màu" },
              ]}
            />
          </Form.Item>
        </Flex>
      </Flex>
    </FormSection>
  );
}

// Ảnh nguyên liệu: để nhận diện trong Kho và để lựa chọn Thủ công dùng lại (nút "Dùng ảnh của nguyên liệu" chép sang)
export function MaterialImages() {
  return (
    <FormSection title="Ảnh" description={`Tối đa ${MAX_IMAGES} ảnh, mỗi ảnh ≤ ${MAX_FILE_MB}MB. Lựa chọn Thủ công dùng nguyên liệu này có thể lấy lại ảnh — đổi ảnh ở Thủ công không đổi ảnh ở đây.`}>
      <Form.Item name="images" noStyle>
        <ImageUpload />
      </Form.Item>
    </FormSection>
  );
}
