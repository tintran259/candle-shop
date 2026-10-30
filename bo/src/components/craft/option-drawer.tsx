import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Checkbox, Col, ColorPicker, Drawer, Flex, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Select, Typography } from "antd";
import { useDeferredValue, useState } from "react";
import { MaterialPreview } from "@/components/craft/material-preview";
import { fromFormValues, toFormValues, type OptionFormValues } from "@/components/craft/option-form";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { ImageUpload } from "@/components/form/image-upload";
import { MoneyInput } from "@/components/money-input";
import { DrawerFormSkeleton } from "@/components/skeletons";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { shapeLabels, unitLabel } from "@/lib/craft/groups";
import { MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import { isOptionStep, previewRoleMeta } from "@/lib/craft/steps";
import type { CraftConfig, OptionStep, StepOption } from "@/lib/craft/types";

type Props = { open: boolean; step: OptionStep; option?: StepOption; config: CraftConfig; api: CraftConfigApi; onClose: () => void };

// Drawer thêm/sửa một lựa chọn: thẻ xem trước + các khối trường theo component của bước.
// Mount lại theo key mỗi lần mở nên form luôn bắt đầu từ dữ liệu mới.
export function OptionDrawer({ open, step, option, config, api, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Drawer trượt ra ngay với khung xương; form (nặng) mount ngay sau ở chế độ ưu tiên thấp
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<OptionFormValues>();
  const unlimited = Form.useWatch("unlimited", form);
  const hasSwatch = Form.useWatch("hasSwatch", form);
  const [dirty, setDirty] = useState(false);
  const unit = step.kind === "vessel" ? "pcs" : step.unit;
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
    const next = fromFormValues(step, values, option);
    if (!api.saveOption(step.id, next, option?.id)) return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    message.success(option ? `Đã lưu ${next.name.vi}` : `Đã thêm ${next.name.vi}`);
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
            {option ? "Lưu thay đổi" : "Thêm lựa chọn"}
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
            <MaterialPreview unit={unit} swatch groupLabel={step.title.vi} />

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

            <FormSection title="Giá & tồn kho" description={step.kind === "blend" ? "Phụ thu tính theo tỉ lệ khách phối (vd 50% → một nửa phụ thu)." : "Phụ thu được cộng vào giá gốc theo kích thước."}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="price" label="Phụ thu mỗi hũ">
                    <MoneyInput />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="stock" label={`Tồn kho (${unitLabel[unit]})`}>
                    <InputNumber min={0} precision={0} disabled={unlimited} placeholder={unlimited ? "Không theo dõi" : undefined} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
              <SwitchField name="unlimited" label="Không theo dõi tồn kho" description="Dùng cho lựa chọn kiểu “Không mùi”, “Không màu”." />
              <SwitchField name="available" label="Đang bán" description="Tắt để tạm ẩn với khách dù vẫn còn hàng." last />
            </FormSection>

            <FormSection title="Hình ảnh & màu" description={`Tối đa ${MAX_IMAGES} ảnh, mỗi ảnh ≤ ${MAX_FILE_MB}MB. Không có ảnh thì web dùng màu.`}>
              <Form.Item name="images" noStyle>
                <ImageUpload />
              </Form.Item>
              <Flex justify="space-between" align="center" gap={16} style={{ marginTop: 16 }}>
                <Flex vertical>
                  <Typography.Text strong>Màu hiển thị</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {step.kind === "swatches" ? "Tắt = “không pha màu” (ô sọc)." : role === "waxColor" ? "Tô lên phần sáp trong ảnh minh họa." : "Dùng khi chưa có ảnh."}
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

            {step.kind === "vessel" && <VesselFields sizes={step.sizes} />}

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
                <Form.Item name="maxGrams" label="Khối lượng nến tối đa" extra="Để trống nếu không giới hạn." style={{ marginBottom: 0 }}>
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

function VesselFields({ sizes }: { sizes: Extract<OptionStep, { kind: "vessel" }>["sizes"] }) {
  const hasLid = Form.useWatch("hasLid");
  return (
    <FormSection title="Hũ & nắp" description="Dáng hũ (vẽ trong ảnh minh họa), kích thước đổ được và nắp đi kèm.">
      <Form.Item name="shape" label="Dáng hũ">
        <Radio.Group optionType="button" options={Object.entries(shapeLabels).map(([value, label]) => ({ value, label }))} />
      </Form.Item>
      <Form.Item
        name="supportedSizeIds"
        label="Kích thước đổ được"
        extra="Khách chỉ chọn được các kích thước đã tích. Sửa danh sách ở tab Kích thước."
        rules={[{ required: true, type: "array", min: 1, message: "Chọn ít nhất một kích thước." }]}
      >
        <Checkbox.Group options={sizes.map((s) => ({ value: s.id, label: `${s.grams}g` }))} />
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
}
