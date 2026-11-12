import { Col, DatePicker, Flex, Form, Input, Modal, Row, Select, Tag } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { TaxonomyApi } from "@/hooks/use-taxonomy";
import { slugify } from "@/lib/craft/groups";
import { taxonomyColors, type Taxonomy, type TaxonomyKind } from "@/lib/products/taxonomy";

// range: thời gian bán của concept — mỗi đầu để trống được
type Values = { vi: string; en: string; color: string; range?: [Dayjs | null, Dayjs | null] | null };
const ymd = (d?: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : null);
type Props = { open: boolean; item?: Taxonomy; api: TaxonomyApi; kind: TaxonomyKind; onClose: () => void };

// Thêm/sửa danh mục hoặc concept. Id tạo từ tên lúc thêm và giữ nguyên khi đổi tên.
export function TaxonomyModal({ open, item, api, kind, onClose }: Props) {
  const [form] = Form.useForm<Values>();
  const color = Form.useWatch("color", form) ?? "default";
  const vi = Form.useWatch("vi", form);

  const finish = (v: Values) => {
    let id = item?.id ?? (slugify(v.vi) || kind.fallbackId);
    if (!item) for (let i = 2; api.byId.has(id); i++) id = `${slugify(v.vi) || kind.fallbackId}-${i}`;
    const dates = kind.dates ? { startsOn: ymd(v.range?.[0]), endsOn: ymd(v.range?.[1]) } : {};
    api.save({ id, name: { vi: v.vi.trim(), en: v.en?.trim() || v.vi.trim() }, color: v.color, hidden: item?.hidden ?? false, ...dates });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={item ? `Sửa ${kind.noun}` : `Thêm ${kind.noun}`}
      okText={item ? "Lưu" : `Thêm ${kind.noun}`}
      cancelText="Hủy"
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          vi: item?.name.vi ?? "",
          en: item?.name.en ?? "",
          color: item?.color ?? "default",
          range: item?.startsOn || item?.endsOn ? [item.startsOn ? dayjs(item.startsOn) : null, item.endsOn ? dayjs(item.endsOn) : null] : null,
        }}
        onFinish={finish}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="vi"
              label="Tên (tiếng Việt)"
              rules={[
                { required: true, whitespace: true, message: `Nhập tên ${kind.noun}.` },
                {
                  validator: (_, v?: string) =>
                    api.items.some((c) => c.id !== item?.id && slugify(c.name.vi) === slugify(v ?? "")) ? Promise.reject(new Error(`Đã có ${kind.noun} tên này.`)) : Promise.resolve(),
                },
              ]}
            >
              <Input autoFocus maxLength={40} placeholder={kind.placeholder} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="en" label="Tên (tiếng Anh)" extra="Để trống thì dùng tên tiếng Việt.">
              <Input maxLength={40} />
            </Form.Item>
          </Col>
        </Row>
        {kind.dates && (
          <Form.Item
            name="range"
            label="Thời gian bán"
            extra="Để trống = mọi ngày. Sản phẩm thuộc concept tự mở bán trên web từ ngày bắt đầu và tự đóng sau ngày kết thúc (giờ Việt Nam). Muốn bán tiếp thì sửa ngày ở đây."
          >
            <DatePicker.RangePicker allowEmpty={[true, true]} format="DD/MM/YYYY" placeholder={["Từ ngày", "Đến ngày"]} aria-label="Thời gian bán" style={{ width: "100%" }} />
          </Form.Item>
        )}
        <Form.Item name="color" label="Màu tag" style={{ marginBottom: 12 }}>
          <Select
            options={taxonomyColors.map((c) => ({
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
            {vi?.trim() || `Tên ${kind.noun}`}
          </Tag>
        </Flex>
      </Form>
    </Modal>
  );
}
