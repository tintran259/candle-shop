import { DeleteOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, Col, Flex, Form, Input, InputNumber, Popconfirm, Row, Switch, Typography } from "antd";
import { useEffect, useState } from "react";
import { useBlocker } from "react-router";
import { FormSection } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import { SettingsSkeleton } from "@/components/skeletons";
import { useSettings } from "@/hooks/use-settings";
import { formatMoney } from "@/lib/format";
import { depositAmount } from "@/lib/orders/create";
import { defaultSettings, shippingOptionLabel, type ShippingOption, type ShopSettings } from "@/lib/settings/types";
import { useTitle } from "@/lib/use-title";
import { radius } from "@/theme";

// Đơn mẫu ở khung xem trước
const SAMPLE_SUBTOTAL = 1_000_000;

export function SettingsPage() {
  useTitle("Cài đặt");
  const { settings, loading, save } = useSettings();
  if (loading) return <SettingsSkeleton />;
  return <SettingsForm settings={settings} save={save} />;
}

function SettingsForm({ settings, save }: { settings: ShopSettings; save: (s: ShopSettings) => void }) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<ShopSettings>();
  const [dirty, setDirty] = useState(false);
  const values = (Form.useWatch([], { form, preserve: true }) ?? settings) as ShopSettings;

  // Rời trang khi còn thay đổi chưa lưu thì hỏi lại
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    modal.confirm({
      title: "Bỏ các thay đổi chưa lưu?",
      okText: "Bỏ thay đổi",
      okButtonProps: { danger: true },
      cancelText: "Tiếp tục sửa",
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
    });
  }, [blocker, modal]);

  const finish = () => {
    // getFieldsValue(true): lấy cả id của phương thức — trường không có ô nhập nên onFinish bỏ mất
    const v = form.getFieldsValue(true) as ShopSettings;
    save({ ...v, shippingOptions: v.shippingOptions.map((o) => ({ ...o, name: o.name.trim() })) });
    setDirty(false);
    message.success("Đã lưu cài đặt. Áp dụng cho đơn tạo từ bây giờ.");
  };

  return (
    <Form form={form} layout="vertical" initialValues={settings} onFinish={finish} onValuesChange={() => setDirty(true)} scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="flex-end" wrap gap={16}>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Cài đặt
            </Typography.Title>
            <Typography.Text type="secondary">Tiền cọc, giao hàng và phí vận chuyển. Đổi ở đây chỉ áp dụng cho đơn mới, đơn cũ giữ nguyên.</Typography.Text>
          </div>
          <Flex gap={8} align="center" wrap>
            {dirty && (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Có thay đổi chưa lưu
              </Typography.Text>
            )}
            <Popconfirm
              title="Khôi phục mặc định?"
              description="Điền lại các giá trị mặc định. Chỉ có hiệu lực khi bấm Lưu."
              okText="Khôi phục"
              cancelText="Hủy"
              onConfirm={() => {
                form.setFieldsValue(defaultSettings);
                setDirty(true);
              }}
            >
              <Button icon={<ReloadOutlined />}>Mặc định</Button>
            </Popconfirm>
            <Button type="primary" htmlType="submit" disabled={!dirty}>
              {dirty ? "Lưu cài đặt" : "Đã lưu"}
            </Button>
          </Flex>
        </Flex>

        <Row gutter={[16, 16]} align="top">
          <Col xs={24} lg={16}>
            <Flex vertical gap={16}>
              <FormSection title="Đặt cọc" description="Khách chọn đặt cọc thì trả trước phần này, còn lại thu khi giao.">
                <Form.Item
                  name="depositPercent"
                  label="Mức cọc"
                  rules={[{ required: true, type: "number", min: 1, max: 99, message: "Nhập từ 1 đến 99%." }]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber min={1} max={99} precision={0} suffix="%" aria-label="Mức cọc" style={{ width: 160 }} />
                </Form.Item>
              </FormSection>

              <FormSection title="Giao hàng" description="Áp dụng khi giao không thành.">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="maxDeliveryAttempts"
                      label="Số lần giao tối đa"
                      extra="Hết số lần này thì đơn chuyển sang hoàn về."
                      rules={[{ required: true, type: "number", min: 1, max: 10, message: "Nhập từ 1 đến 10 lần." }]}
                    >
                      <InputNumber min={1} max={10} precision={0} suffix="lần" aria-label="Số lần giao tối đa" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="resendFee" label="Phí gửi lại đơn" extra="Khách trả khi gửi lại đơn đã hoàn về." rules={[{ required: true, message: "Nhập phí gửi lại." }]}>
                      <MoneyInput aria-label="Phí gửi lại đơn" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Phí vận chuyển" description="Các phương thức hiện khi tạo đơn. Phí tự điền theo phương thức và vẫn sửa được ở từng đơn.">
                <Form.List
                  name="shippingOptions"
                  rules={[
                    {
                      validator: async (_, list: ShippingOption[] = []) => {
                        if (!list.some((o) => o.enabled)) throw new Error("Cần ít nhất một phương thức đang dùng.");
                        const names = list.map((o) => o.name?.trim().toLowerCase()).filter(Boolean);
                        if (new Set(names).size !== names.length) throw new Error("Tên phương thức bị trùng.");
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <Flex vertical gap={8}>
                      <div className="ship-row ship-head" aria-hidden>
                        <span>Dùng</span>
                        <span>Tên phương thức</span>
                        <span>Phí</span>
                        <span>Số ngày</span>
                        <span />
                      </div>
                      {fields.map((field) => (
                        <div key={field.key} className="ship-row" role="group" aria-label={`Phương thức ${field.name + 1}`}>
                          <Form.Item name={[field.name, "enabled"]} valuePropName="checked" noStyle>
                            <Switch aria-label="Đang dùng" className="ship-switch" />
                          </Form.Item>
                          <Form.Item name={[field.name, "name"]} rules={[{ required: true, whitespace: true, message: "Nhập tên." }]} className="ship-name" style={{ marginBottom: 0 }}>
                            <Input maxLength={40} placeholder="VD: Nội thành" aria-label="Tên phương thức" />
                          </Form.Item>
                          <Form.Item name={[field.name, "fee"]} rules={[{ required: true, message: "Nhập phí." }]} className="ship-fee" style={{ marginBottom: 0 }}>
                            <MoneyInput aria-label="Phí vận chuyển" />
                          </Form.Item>
                          <Form.Item name={[field.name, "days"]} rules={[{ required: true, message: "Nhập số ngày." }]} className="ship-days" style={{ marginBottom: 0 }}>
                            <InputNumber min={0} max={60} precision={0} suffix="ngày" aria-label="Số ngày giao" style={{ width: "100%" }} />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={`Xóa phương thức ${field.name + 1}`}
                            disabled={fields.length === 1}
                            onClick={() => remove(field.name)}
                            className="ship-remove"
                          />
                        </div>
                      ))}
                      <Form.ErrorList errors={errors} />
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => add({ id: `ship-${Date.now().toString(36)}`, name: "", fee: 0, days: 3, enabled: true })}
                        style={{ alignSelf: "flex-start", marginTop: 4 }}
                      >
                        Thêm phương thức
                      </Button>
                    </Flex>
                  )}
                </Form.List>
              </FormSection>
            </Flex>
          </Col>

          <Col xs={24} lg={8}>
            <Preview values={values} />
          </Col>
        </Row>
      </Flex>
    </Form>
  );
}

const money = (n?: number | string) => formatMoney(Number(n) || 0);

// Xem trước tiền trên một đơn mẫu theo các giá trị đang nhập
function Preview({ values }: { values: ShopSettings }) {
  const options = (values.shippingOptions ?? []).filter((o) => o?.enabled);
  const first = options[0];
  const fee = Number(first?.fee) || 0;
  const total = SAMPLE_SUBTOTAL + fee;
  const percent = Number(values.depositPercent) || 0;
  const deposit = depositAmount(total, percent);
  const rows = [
    ["Tạm tính", money(SAMPLE_SUBTOTAL)],
    [first?.name?.trim() ? `Phí giao · ${first.name.trim()}` : "Phí giao", fee ? money(fee) : "Miễn phí"],
  ];

  return (
    <aside className="settings-preview" aria-label="Xem trước trên đơn mẫu" style={{ borderRadius: radius.card }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Xem trước
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Đơn mẫu theo các số đang nhập.
      </Typography.Text>
      <div style={{ marginTop: 12 }}>
        {rows.map(([label, value]) => (
          <Flex key={label} justify="space-between" gap={12} style={{ padding: "3px 0" }}>
            <Typography.Text type="secondary">{label}</Typography.Text>
            <Typography.Text className="tabular" style={{ whiteSpace: "nowrap" }}>
              {value}
            </Typography.Text>
          </Flex>
        ))}
        <Flex justify="space-between" align="baseline" style={{ padding: "8px 0 4px", borderTop: "1px solid #eee5da", marginTop: 6 }}>
          <Typography.Text strong>Tổng</Typography.Text>
          <Typography.Text strong className="tabular" style={{ fontSize: 20 }}>
            {money(total)}
          </Typography.Text>
        </Flex>
        <Flex justify="space-between" style={{ padding: "3px 0" }}>
          <Typography.Text type="secondary">Cọc {percent}% khi đặt</Typography.Text>
          <Typography.Text className="tabular">{money(deposit)}</Typography.Text>
        </Flex>
        <Flex justify="space-between" style={{ padding: "3px 0" }}>
          <Typography.Text type="secondary">Thu nốt khi giao</Typography.Text>
          <Typography.Text className="tabular">{money(total - deposit)}</Typography.Text>
        </Flex>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee5da" }}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Khi tạo đơn hiện {options.length} phương thức
        </Typography.Text>
        <ul style={{ margin: "4px 0 0", paddingInlineStart: 18, fontSize: 13 }}>
          {options.map((o) => (
            <li key={o.id}>
              {shippingOptionLabel({ name: o.name?.trim() || "Chưa đặt tên", days: o.days ?? 0 })} · {Number(o.fee) ? money(o.fee) : "miễn phí"}
            </li>
          ))}
        </ul>
        <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0", fontSize: 13 }}>
          Giao tối đa {values.maxDeliveryAttempts ?? 0} lần · Gửi lại đơn {money(values.resendFee)}
        </Typography.Paragraph>
      </div>
    </aside>
  );
}
