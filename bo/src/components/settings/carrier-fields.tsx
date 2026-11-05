import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, Switch } from "antd";
import { FormSection } from "@/components/form/form-section";
import { type Carrier } from "@/lib/settings/types";

// Cài đặt › Đơn vị vận chuyển: tên, link tra cứu có {code}, bắt buộc mã, bật/tắt
export function CarrierFields() {
  return (
    <FormSection title="Đơn vị vận chuyển" description="Chọn khi giao đơn cho vận chuyển. Link tra cứu dùng {code} thay cho mã vận đơn, để trống thì chỉ sao chép mã.">
      <Form.List
        name="carriers"
        rules={[
          {
            validator: async (_, list: Carrier[] = []) => {
              if (!list.some((c) => c.enabled)) throw new Error("Cần ít nhất một đơn vị đang dùng.");
              const names = list.map((c) => c.name?.trim().toLowerCase()).filter(Boolean);
              if (new Set(names).size !== names.length) throw new Error("Tên đơn vị bị trùng.");
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <Flex vertical gap={8}>
            <div className="carrier-row ship-head" aria-hidden>
              <span>Dùng</span>
              <span>Tên đơn vị</span>
              <span>Link tra cứu</span>
              <span>Bắt buộc mã</span>
              <span />
            </div>
            {fields.map((field) => (
              <div key={field.key} className="carrier-row" role="group" aria-label={`Đơn vị ${field.name + 1}`}>
                <Form.Item name={[field.name, "enabled"]} valuePropName="checked" noStyle>
                  <Switch aria-label="Đang dùng" className="ship-switch" />
                </Form.Item>
                <Form.Item name={[field.name, "name"]} rules={[{ required: true, whitespace: true, message: "Nhập tên." }]} className="carrier-name" style={{ marginBottom: 0 }}>
                  <Input maxLength={40} placeholder="VD: Ahamove" aria-label="Tên đơn vị" />
                </Form.Item>
                <Form.Item
                  name={[field.name, "trackingUrl"]}
                  rules={[{ pattern: /^https?:\/\/\S*\{code\}\S*$/, message: "Link bắt đầu bằng http và có {code}." }]}
                  className="carrier-url"
                  style={{ marginBottom: 0 }}
                >
                  <Input maxLength={200} placeholder="https://…{code}" aria-label="Link tra cứu" />
                </Form.Item>
                <Form.Item name={[field.name, "requireCode"]} valuePropName="checked" noStyle>
                  <Switch aria-label="Bắt buộc mã vận đơn" className="ship-switch carrier-code" />
                </Form.Item>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Xóa đơn vị ${field.name + 1}`}
                  disabled={fields.length === 1}
                  onClick={() => remove(field.name)}
                  className="ship-remove"
                />
              </div>
            ))}
            <Form.ErrorList errors={errors} />
            <Button
              icon={<PlusOutlined />}
              onClick={() => add({ id: `carrier-${Date.now().toString(36)}`, name: "", requireCode: true, enabled: true })}
              style={{ alignSelf: "flex-start", marginTop: 4 }}
            >
              Thêm đơn vị
            </Button>
          </Flex>
        )}
      </Form.List>
    </FormSection>
  );
}
