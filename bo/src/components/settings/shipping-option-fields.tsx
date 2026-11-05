import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, InputNumber, Switch } from "antd";
import { FormSection } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import { type ShippingOption } from "@/lib/settings/types";

// Cài đặt › Phí vận chuyển: các phương thức hiện khi tạo đơn (tên, phí, số ngày, bật/tắt)
export function ShippingOptionFields() {
  return (
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
            <Button icon={<PlusOutlined />} onClick={() => add({ id: `ship-${Date.now().toString(36)}`, name: "", fee: 0, days: 3, enabled: true })} style={{ alignSelf: "flex-start", marginTop: 4 }}>
              Thêm phương thức
            </Button>
          </Flex>
        )}
      </Form.List>
    </FormSection>
  );
}
