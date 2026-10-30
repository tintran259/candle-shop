import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Col, ColorPicker, Drawer, Flex, Form, Grid, Input, InputNumber, Popconfirm, Row, Typography } from "antd";
import { useDeferredValue, useState } from "react";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { ImageUpload } from "@/components/form/image-upload";
import { MoneyInput } from "@/components/money-input";
import { ExtraFields } from "@/components/craft/material-extra-fields";
import { fromFormValues, toFormValues, type MaterialFormValues } from "@/components/craft/material-form";
import { MaterialPreview } from "@/components/craft/material-preview";
import { DrawerFormSkeleton } from "@/components/skeletons";
import type { CraftCatalogApi } from "@/hooks/use-craft-catalog";
import { optionGroups, unitLabel, type OptionGroup } from "@/lib/craft/groups";
import { MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import type { BaseOption } from "@/lib/craft/types";

// Drawer thêm/sửa một nguyên liệu: thẻ xem trước + các khối trường theo chủ đề.
// Bảng mount lại theo key nên form luôn bắt đầu từ dữ liệu mới.
export function MaterialDrawer({
  open,
  group,
  item,
  api,
  onClose,
}: {
  open: boolean;
  group: OptionGroup;
  item?: BaseOption;
  api: CraftCatalogApi;
  onClose: () => void;
}) {
  const meta = optionGroups[group];
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Drawer trượt ra ngay với khung xương; form (nặng) mount ngay sau ở chế độ ưu tiên thấp để không chặn hiệu ứng
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<MaterialFormValues>();
  const unlimited = Form.useWatch("unlimited", form);
  const [dirty, setDirty] = useState(false);

  // Có thay đổi chưa lưu thì hỏi lại trước khi đóng
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

  const finish = (values: MaterialFormValues) => {
    const option = fromFormValues(group, values, item);
    if (!option.id) return form.setFields([{ name: "nameVi", errors: ["Tên cần có chữ hoặc số."] }]);
    if (!item && (api.catalog[group] as BaseOption[]).some((o) => o.id === option.id)) {
      return form.setFields([{ name: "nameVi", errors: ["Đã có nguyên liệu trùng tên trong nhóm này."] }]);
    }
    if (!api.saveOption(group, option, item?.id)) {
      return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    }
    message.success(item ? `Đã lưu ${option.name.vi}` : `Đã thêm ${option.name.vi}`);
    onClose();
  };

  const remove = () => {
    if (!item) return;
    api.removeOption(group, item.id);
    message.success(`Đã xóa ${item.name.vi}`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      title={item ? "Sửa nguyên liệu" : `Thêm ${meta.label.toLowerCase()}`}
      size={screens.sm === false ? "100%" : 640}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {item && (
            <Popconfirm
              title={`Xóa “${item.name.vi}”?`}
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
            <Typography.Text type="secondary" style={{ marginLeft: item ? 8 : 0, fontSize: 13 }}>
              Có thay đổi chưa lưu
            </Typography.Text>
          )}
          <Button onClick={requestClose} style={{ marginLeft: "auto" }}>
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()}>
            {item ? "Lưu thay đổi" : "Thêm nguyên liệu"}
          </Button>
        </Flex>
      }
    >
      {ready ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={toFormValues(group, item)}
          onFinish={finish}
          onValuesChange={() => setDirty(true)}
          scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
        >
          <Flex vertical gap={16}>
            <MaterialPreview unit={meta.unit} swatch={meta.swatch} groupLabel={meta.label} />

            <FormSection title="Thông tin cơ bản" description="Tên và mô tả hiển thị cho khách trên trang Thủ công.">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="nameVi" label="Tên (Tiếng Việt)" rules={[{ required: true, whitespace: true, message: "Nhập tên tiếng Việt." }]}>
                    <Input autoFocus placeholder="VD: Sáp đậu nành" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="nameEn" label="Tên (English)" extra="Để trống sẽ dùng tên tiếng Việt.">
                    <Input placeholder="VD: Soy wax" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="descVi" label="Mô tả ngắn (VI)" style={{ marginBottom: screens.sm === false ? undefined : 0 }}>
                    <Input placeholder="VD: Cháy sạch, ít khói" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="descEn" label="Mô tả ngắn (EN)" style={{ marginBottom: 0 }}>
                    <Input placeholder="VD: Clean, low-soot burn" />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            <FormSection title="Giá & tồn kho" description="Phụ thu được cộng vào giá gốc theo kích thước.">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="price" label="Phụ thu mỗi hũ">
                    <MoneyInput />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="stock" label={`Tồn kho (${unitLabel[meta.unit]})`}>
                    <InputNumber min={0} precision={0} disabled={unlimited} placeholder={unlimited ? "Không theo dõi" : undefined} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
              <SwitchField name="unlimited" label="Không theo dõi tồn kho" description="Dùng cho lựa chọn kiểu “Không mùi”, “Không màu”." last />
            </FormSection>

            <FormSection title="Hình ảnh" description={`Tối đa ${MAX_IMAGES} ảnh, mỗi ảnh ≤ ${MAX_FILE_MB}MB. Ảnh đầu tiên là ảnh chính — bấm ★ để đổi.`}>
              <Form.Item name="images" noStyle>
                <ImageUpload />
              </Form.Item>
            </FormSection>

            <FormSection title="Hiển thị">
              <SwitchField name="available" label="Đang bán" description="Tắt để tạm ẩn với khách dù vẫn còn hàng." last={!meta.swatch} />
              {meta.swatch && (
                <Flex justify="space-between" align="center" gap={16} style={{ paddingTop: 10 }}>
                  <Flex vertical>
                    <Typography.Text strong>Màu hiển thị</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      Dùng khi nguyên liệu chưa có ảnh.
                    </Typography.Text>
                  </Flex>
                  <Form.Item name="swatch" noStyle getValueFromEvent={(color) => color.toHexString()}>
                    <ColorPicker showText disabledAlpha aria-label="Màu hiển thị" />
                  </Form.Item>
                </Flex>
              )}
            </FormSection>

            <ExtraFields group={group} catalog={api.catalog} />
          </Flex>
        </Form>
      ) : (
        <DrawerFormSkeleton />
      )}
    </Drawer>
  );
}
