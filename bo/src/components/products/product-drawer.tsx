import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Col, Descriptions, Drawer, Flex, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Select, Typography } from "antd";
import { useState } from "react";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { ImageUpload } from "@/components/form/image-upload";
import { MoneyInput } from "@/components/money-input";
import { fromFormValues, toFormValues, type ProductFormValues } from "@/components/products/product-form";
import { ProductPreview } from "@/components/products/product-preview";
import { RatingText } from "@/components/products/product-view";
import { useCraftCatalog } from "@/hooks/use-craft-catalog";
import type { ProductsApi } from "@/hooks/use-products";
import { slugify } from "@/lib/craft/groups";
import { formatNumber } from "@/lib/format";
import { MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import { aromaLevelLabels, aromaTypeLabels, discountPercent, sizeLabels, toOptions } from "@/lib/products/labels";
import type { Product } from "@/lib/products/types";

type Props = { open: boolean; product?: Product; api: ProductsApi; onClose: () => void };

// Drawer thêm/sửa sản phẩm. Trang mount lại theo key nên form luôn bắt đầu từ dữ liệu mới.
export function ProductDrawer({ open, product, api, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const { catalog } = useCraftCatalog();
  const [form] = Form.useForm<ProductFormValues>();
  const [dirty, setDirty] = useState(false);
  // Slug tự đi theo tên cho tới khi người dùng tự sửa slug (sản phẩm đã có thì giữ nguyên)
  const [slugLocked, setSlugLocked] = useState(!!product);
  const price = Form.useWatch("price", form) ?? 0;
  const salePrice = Form.useWatch("salePrice", form);
  const off = discountPercent({ price, salePrice: salePrice ?? undefined });

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

  const finish = (values: ProductFormValues) => {
    const next = fromFormValues(values, product);
    if (api.products.some((p) => p.slug === next.slug && p.id !== next.id)) {
      return form.setFields([{ name: "slug", errors: ["Slug đã được dùng cho sản phẩm khác."] }]);
    }
    if (!api.save(next)) return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    message.success(product ? `Đã lưu ${next.name}` : `Đã thêm ${next.name}`);
    onClose();
  };

  const remove = () => {
    if (!product) return;
    api.remove([product.id]);
    message.success(`Đã xóa ${product.name}`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      title={product ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      size={screens.sm === false ? "100%" : 680}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {product && (
            <Popconfirm
              title={`Xóa “${product.name}”?`}
              description="Không thể hoàn tác. Đơn hàng cũ vẫn giữ thông tin sản phẩm."
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
            {product ? "Lưu thay đổi" : "Thêm sản phẩm"}
          </Button>
        </Flex>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={toFormValues(product)}
        onFinish={finish}
        onValuesChange={(changed: Partial<ProductFormValues>) => {
          setDirty(true);
          if ("slug" in changed) setSlugLocked(true);
          else if ("name" in changed && !slugLocked) form.setFieldValue("slug", slugify(changed.name ?? ""));
        }}
        scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
      >
        <Flex vertical gap={16}>
          <ProductPreview />

          <FormSection title="Thông tin cơ bản" description="Tên, đường dẫn và mô tả hiển thị trên trang sản phẩm.">
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, whitespace: true, message: "Nhập tên sản phẩm." }]}>
              <Input autoFocus placeholder="VD: Moon Morning" maxLength={80} />
            </Form.Item>
            <Form.Item
              name="slug"
              label="Slug (đường dẫn)"
              extra={slugLocked ? "Đổi slug sẽ làm link cũ của sản phẩm không còn dùng được." : "Tự tạo theo tên — sửa nếu muốn."}
              rules={[
                { required: true, message: "Nhập slug." },
                { pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, message: "Chỉ dùng chữ thường không dấu, số và dấu gạch ngang." },
              ]}
            >
              <Input prefix={<Typography.Text type="secondary">/products/</Typography.Text>} placeholder="moon-morning" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả" style={{ marginBottom: 20 }}>
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} showCount maxLength={300} placeholder="Mùi hương, cảm giác, dịp phù hợp…" />
            </Form.Item>
          </FormSection>

          <FormSection title="Giá" description="Để trống giá giảm nếu không khuyến mãi.">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="price" label="Giá bán" rules={[{ required: true, type: "number", min: 1000, message: "Nhập giá bán." }]} style={{ marginBottom: 0 }}>
                  <MoneyInput />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="salePrice"
                  label="Giá giảm"
                  dependencies={["price"]}
                  extra={off ? `Giảm ${off}% so với giá bán` : undefined}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator: (_, v?: number | null) =>
                        !v || v < getFieldValue("price") ? Promise.resolve() : Promise.reject(new Error("Giá giảm phải thấp hơn giá bán.")),
                    }),
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <MoneyInput placeholder="Không giảm" />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Phân loại & đặc tính" description="Dùng cho bộ lọc trên web và thông tin trang chi tiết.">
            <Form.Item name="aromaType" label="Loại hương">
              <Radio.Group optionType="button" options={toOptions(aromaTypeLabels)} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="size" label="Kích thước">
                  <Radio.Group optionType="button" options={toOptions(sizeLabels)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="aromaLevel" label="Độ thơm">
                  <Radio.Group optionType="button" options={toOptions(aromaLevelLabels)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="scent" label="Nốt hương">
                  <Input placeholder="VD: Hoa nhài, xạ hương trắng" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="waxType" label="Loại sáp" extra="Lấy từ danh sách sáp ở trang Thủ công.">
                  <Select allowClear placeholder="Chọn loại sáp" options={catalog.waxes.map((w) => ({ value: w.name.vi, label: w.name.vi }))} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="burnTime" label="Thời gian cháy" style={{ marginBottom: 0 }}>
                  <InputNumber min={1} precision={0} suffix="giờ" placeholder="Chưa đo" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Hình ảnh" description={`Tối đa ${MAX_IMAGES} ảnh, mỗi ảnh ≤ ${MAX_FILE_MB}MB. Ảnh đầu tiên là ảnh chính — bấm ☆ để đổi.`}>
            <Form.Item name="images" rules={[{ required: true, type: "array", min: 1, message: "Thêm ít nhất một ảnh." }]} style={{ marginBottom: 0 }}>
              <ImageUpload />
            </Form.Item>
          </FormSection>

          <FormSection title="Hiển thị">
            <SwitchField name="active" label="Đang bán" description="Tắt để tạm ẩn khỏi web — link cũ sẽ báo không còn bán." />
            <SwitchField name="isNew" label="Nhãn “Mới”" description="Hiện nhãn Mới trên thẻ sản phẩm." />
            <SwitchField name="isFeatured" label="Nổi bật" description="Ưu tiên ở trang chủ và sắp xếp “Nổi bật”." last />
          </FormSection>

          {product && (
            <FormSection title="Số liệu" description="Tự cập nhật từ đơn hàng và đánh giá — không sửa được.">
              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2 }}
                items={[
                  { key: "sold", label: "Đã bán", children: formatNumber(product.sold) },
                  { key: "rating", label: "Đánh giá", children: <RatingText product={product} /> },
                  { key: "created", label: "Tạo ngày", children: product.createdAt },
                  { key: "updated", label: "Cập nhật", children: product.updatedAt },
                ]}
              />
            </FormSection>
          )}
        </Flex>
      </Form>
    </Drawer>
  );
}
