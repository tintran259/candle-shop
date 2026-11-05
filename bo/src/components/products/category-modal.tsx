import { Col, Flex, Form, Input, Modal, Row, Select, Tag } from "antd";
import type { CategoriesApi } from "@/hooks/use-categories";
import { slugify } from "@/lib/craft/groups";
import { categoryColors, type Category } from "@/lib/products/categories";

type Values = { vi: string; en: string; color: string };
type Props = { open: boolean; category?: Category; api: CategoriesApi; onClose: () => void };

// Thêm/sửa danh mục. Id tạo từ tên lúc thêm và giữ nguyên khi đổi tên.
export function CategoryModal({ open, category, api, onClose }: Props) {
  const [form] = Form.useForm<Values>();
  const color = Form.useWatch("color", form) ?? "default";
  const vi = Form.useWatch("vi", form);

  const finish = (v: Values) => {
    let id = category?.id ?? (slugify(v.vi) || "danh-muc");
    if (!category) for (let i = 2; api.byId.has(id); i++) id = `${slugify(v.vi)}-${i}`;
    api.save({ id, name: { vi: v.vi.trim(), en: v.en?.trim() || v.vi.trim() }, color: v.color, hidden: category?.hidden ?? false });
    onClose();
  };

  return (
    <Modal open={open} title={category ? "Sửa danh mục" : "Thêm danh mục"} okText={category ? "Lưu" : "Thêm danh mục"} cancelText="Hủy" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={{ vi: category?.name.vi ?? "", en: category?.name.en ?? "", color: category?.color ?? "default" }} onFinish={finish} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="vi"
              label="Tên (tiếng Việt)"
              rules={[
                { required: true, whitespace: true, message: "Nhập tên danh mục." },
                {
                  validator: (_, v?: string) =>
                    api.categories.some((c) => c.id !== category?.id && slugify(c.name.vi) === slugify(v ?? "")) ? Promise.reject(new Error("Đã có danh mục tên này.")) : Promise.resolve(),
                },
              ]}
            >
              <Input autoFocus maxLength={40} placeholder="VD: Hương gỗ" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="en" label="Tên (tiếng Anh)" extra="Để trống thì dùng tên tiếng Việt.">
              <Input maxLength={40} placeholder="VD: Woody" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="color" label="Màu tag" style={{ marginBottom: 12 }}>
          <Select
            options={categoryColors.map((c) => ({
              value: c.value,
              label: (
                <Tag color={c.value} style={{ marginInlineEnd: 0 }}>
                  {c.label}
                </Tag>
              ),
            }))}
          />
        </Form.Item>
        <Flex gap={8} align="center">
          <span style={{ fontSize: 13, color: "#6b6b6b" }}>Xem trước:</span>
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            {vi?.trim() || "Tên danh mục"}
          </Tag>
        </Flex>
      </Form>
    </Modal>
  );
}
