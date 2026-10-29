import { DeleteOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { App, Button, Col, DatePicker, Drawer, Flex, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Segmented, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router";
import { fromFormValues, toFormValues, type DiscountFormValues } from "@/components/discounts/discount-form";
import { DiscountTicket } from "@/components/discounts/discount-ticket";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import type { DiscountsApi } from "@/hooks/use-discounts";
import { useOrders } from "@/hooks/use-orders";
import { normalizeCode, randomCode, scopeLabels, typeLabels } from "@/lib/discounts/labels";
import type { Discount, DiscountType } from "@/lib/discounts/types";
import { formatMoney } from "@/lib/format";

type Props = { open: boolean; discount?: Discount; api: DiscountsApi; onClose: () => void };

const options = <K extends string>(labels: Record<K, string>) => (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

// Drawer tạo/sửa mã: phiếu xem trước cập nhật theo form, các khối Mã → Ưu đãi → Điều kiện → Thời gian & giới hạn
export function DiscountDrawer({ open, discount, api, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<DiscountFormValues>();
  const [dirty, setDirty] = useState(false);
  const values = Form.useWatch([], { form, preserve: true }) as DiscountFormValues | undefined;
  const type = values?.type ?? discount?.type ?? "percent";
  // Form chưa gắn (drawer đóng) thì useWatch trả về rỗng — chỉ dựng phiếu khi đã có loại ưu đãi
  const preview = values?.type ? fromFormValues(values, discount) : undefined;

  const requestClose = () => {
    if (!dirty) return onClose();
    modal.confirm({
      title: "Bỏ các thay đổi chưa lưu?",
      okText: "Bỏ thay đổi",
      okButtonProps: { danger: true },
      cancelText: "Tiếp tục sửa",
      onOk: onClose,
    });
  };

  const finish = (v: DiscountFormValues) => {
    const next = fromFormValues(v, discount);
    if (api.discounts.some((x) => x.code === next.code && x.id !== discount?.id)) {
      return form.setFields([{ name: "code", errors: ["Mã này đã tồn tại."] }]);
    }
    api.save(next);
    message.success(discount ? `Đã lưu mã ${next.code}` : `Đã tạo mã ${next.code}`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      title={discount ? `Sửa mã ${discount.code}` : "Tạo mã giảm giá"}
      size={screens.sm === false ? "100%" : 640}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {discount && (
            <Popconfirm
              title={`Xóa mã ${discount.code}?`}
              description={discount.used ? `Mã đã được dùng ${discount.used} lần — nên tạm dừng thay vì xóa để giữ lịch sử.` : "Không thể hoàn tác."}
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => {
                api.remove(discount.id);
                message.success(`Đã xóa mã ${discount.code}`);
                onClose();
              }}
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
            {discount ? "Lưu thay đổi" : "Tạo mã"}
          </Button>
        </Flex>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={toFormValues(discount)}
        onFinish={finish}
        onValuesChange={() => setDirty(true)}
        scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
      >
        <Flex vertical gap={16}>
          {preview && <DiscountTicket discount={preview} />}

          <FormSection title="Mã & mô tả" description="Khách gõ mã ở bước thanh toán — không phân biệt chữ hoa, thường.">
            <Form.Item
              name="code"
              label="Mã giảm giá"
              getValueFromEvent={(e) => normalizeCode(e.target.value)}
              extra="Chỉ chữ in hoa không dấu và số, 4–20 ký tự."
              rules={[
                { required: true, message: "Nhập mã giảm giá." },
                { min: 4, max: 20, message: "Mã dài 4–20 ký tự." },
              ]}
            >
              <Input
                autoFocus={!discount}
                maxLength={20}
                className="tabular"
                style={{ letterSpacing: "0.06em", fontWeight: 600 }}
                placeholder="VD: CANDLE2510"
                suffix={
                  <Button
                    type="link"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => {
                      form.setFieldValue("code", randomCode());
                      setDirty(true);
                    }}
                    style={{ paddingInline: 0 }}
                  >
                    Tạo ngẫu nhiên
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item name="description" label="Mô tả" extra="Hiện cho khách khi áp mã." style={{ marginBottom: 0 }}>
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={120} showCount placeholder="VD: Giảm 15% cho đơn từ 1 triệu" />
            </Form.Item>
          </FormSection>

          <FormSection title="Ưu đãi">
            <Form.Item name="type" style={{ marginBottom: 16 }}>
              <Segmented<DiscountType> block options={options(typeLabels)} />
            </Form.Item>
            {type === "percent" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="percent" label="Mức giảm" rules={[{ required: true, type: "number", min: 1, max: 100, message: "Từ 1 đến 100%." }]} style={{ marginBottom: 0 }}>
                    <InputNumber min={1} max={100} precision={0} suffix="%" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="maxDiscount" label="Giảm tối đa" extra="Để trống nếu không giới hạn" style={{ marginBottom: 0 }}>
                    <MoneyInput placeholder="Không giới hạn" />
                  </Form.Item>
                </Col>
              </Row>
            )}
            {type === "fixed" && (
              <Form.Item name="amount" label="Số tiền giảm" rules={[{ required: true, type: "number", min: 1000, message: "Nhập số tiền giảm." }]} style={{ marginBottom: 0 }}>
                <MoneyInput />
              </Form.Item>
            )}
            {type === "freeship" && <Typography.Text type="secondary">Phí giao hàng (kể cả giao nhanh) được miễn khi đơn đủ điều kiện.</Typography.Text>}
          </FormSection>

          <FormSection title="Điều kiện áp dụng">
            <Form.Item
              name="minOrder"
              label="Giá trị đơn tối thiểu"
              dependencies={["type", "amount"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, v?: number | null) =>
                    getFieldValue("type") === "fixed" && v && getFieldValue("amount") >= v
                      ? Promise.reject(new Error("Đơn tối thiểu phải lớn hơn số tiền giảm."))
                      : Promise.resolve(),
                }),
              ]}
            >
              <MoneyInput placeholder="Không yêu cầu" />
            </Form.Item>
            <Form.Item name="scope" label="Áp dụng cho">
              <Radio.Group optionType="button" options={options(scopeLabels)} />
            </Form.Item>
            <SwitchField name="firstOrderOnly" label="Chỉ cho khách đặt lần đầu" description="Kiểm tra theo số điện thoại / email." last />
          </FormSection>

          <FormSection title="Thời gian & giới hạn">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="startsAt" label="Bắt đầu" rules={[{ required: true, message: "Chọn ngày bắt đầu." }]}>
                  <DatePicker format="DD/MM/YYYY" allowClear={false} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="endsAt"
                  label="Kết thúc"
                  dependencies={["startsAt"]}
                  extra="Để trống = không hết hạn"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator: (_, v?: dayjs.Dayjs | null) =>
                        !v || !v.isBefore(getFieldValue("startsAt"), "day") ? Promise.resolve() : Promise.reject(new Error("Phải sau ngày bắt đầu.")),
                    }),
                  ]}
                >
                  <DatePicker format="DD/MM/YYYY" placeholder="Không hết hạn" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="usageLimit" label="Tổng lượt dùng" extra={discount ? `Đã dùng ${discount.used} lượt` : "Để trống = không giới hạn"} style={{ marginBottom: 0 }}>
                  <InputNumber min={1} precision={0} placeholder="Không giới hạn" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="perCustomerLimit" label="Mỗi khách dùng tối đa" style={{ marginBottom: 0 }}>
                  <InputNumber min={1} precision={0} suffix="lần" placeholder="Không giới hạn" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Trạng thái">
            <SwitchField name="active" label="Đang bật" description="Tắt để tạm dừng mã ngay, không cần sửa ngày." last />
          </FormSection>

          {discount && <Performance code={discount.code} />}
        </Flex>
      </Form>
    </Drawer>
  );
}

// Hiệu quả của mã — tính từ đơn hàng đã dùng mã (không tính đơn hủy)
function Performance({ code }: { code: string }) {
  const { orders } = useOrders();
  const used = orders.filter((o) => o.discountCode === code && o.status !== "cancelled").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const saved = used.reduce((s, o) => s + o.discount, 0);
  const revenue = used.reduce((s, o) => s + o.total, 0);

  return (
    <FormSection title="Hiệu quả" description="Tính từ các đơn có dùng mã này trong hệ thống.">
      <Flex gap={12}>
        {[
          { label: "Đơn dùng mã", value: String(used.length) },
          { label: "Đã giảm cho khách", value: formatMoney(saved) },
          { label: "Doanh thu từ đơn", value: formatMoney(revenue) },
        ].map((f) => (
          <Flex key={f.label} vertical style={{ flex: 1, minWidth: 0, background: "#f6f6f3", borderRadius: 14, padding: "10px 14px" }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {f.label}
            </Typography.Text>
            <span className="big-number" style={{ fontSize: 18 }}>
              {f.value}
            </span>
          </Flex>
        ))}
      </Flex>
      {used.length > 0 && (
        <Flex vertical gap={6} style={{ marginTop: 12 }}>
          {used.slice(0, 5).map((o) => (
            <Flex key={o.id} justify="space-between" gap={12}>
              <Link to={`/orders?order=${o.id}`} className="tabular">
                {o.code} · {o.customer.name}
              </Link>
              <Typography.Text type="secondary" className="tabular">
                −{formatMoney(o.discount)} · {dayjs(o.createdAt).format("DD/MM")}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      )}
    </FormSection>
  );
}
