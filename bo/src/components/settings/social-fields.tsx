import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, Select, Switch, Typography } from "antd";
import { FormSection } from "@/components/form/form-section";
import { PLATFORMS, SOCIALS_MAX, urlHints, type Platform, type Social } from "@/lib/settings/socials";

const platformOptions = (Object.keys(PLATFORMS) as Platform[]).map((p) => ({ value: p, label: PLATFORMS[p] }));

// Cài đặt › Mạng xã hội (như Đơn vị vận chuyển): bật/tắt, nền tảng, tên hiện, link. Chân trang web hiện các mạng đang bật theo thứ tự này
export function SocialFields() {
  const form = Form.useFormInstance();
  return (
    <FormSection title="Mạng xã hội" description="Hiện ở cột “Theo dõi” cuối mỗi trang web, theo thứ tự này. Tắt để ẩn tạm; chưa có mạng nào thì web ẩn cả cột.">
      <Form.List name="socials">
        {(fields, { add, remove }) => (
          <Flex vertical gap={8}>
            {fields.length > 0 && (
              <div className="social-row ship-head" aria-hidden>
                <span>Dùng</span>
                <span>Nền tảng</span>
                <span>Tên hiện</span>
                <span>Link</span>
                <span />
              </div>
            )}
            {fields.map((field) => {
              const platform = form.getFieldValue(["socials", field.name, "platform"]) as Platform | undefined;
              return (
                <div key={field.key} className="social-row" role="group" aria-label={`Mạng xã hội ${field.name + 1}`}>
                  <Form.Item name={[field.name, "enabled"]} valuePropName="checked" noStyle>
                    <Switch aria-label="Đang dùng" className="ship-switch" />
                  </Form.Item>
                  <Form.Item name={[field.name, "platform"]} className="social-platform" style={{ marginBottom: 0 }}>
                    <Select options={platformOptions} aria-label="Nền tảng" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, "label"]}
                    dependencies={[["socials", field.name, "platform"]]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: async (_, v?: string) => {
                          if (getFieldValue(["socials", field.name, "platform"]) === "other" && !v?.trim()) throw new Error("Nhập tên cho nền tảng Khác.");
                        },
                      }),
                    ]}
                    className="social-label"
                    style={{ marginBottom: 0 }}
                  >
                    <Input maxLength={30} placeholder={platform && platform !== "other" ? PLATFORMS[platform] : "VD: Lazada"} aria-label="Tên hiện" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, "url"]}
                    rules={[
                      { required: true, whitespace: true, message: "Nhập link." },
                      { pattern: /^https:\/\/\S+$/, message: "Link bắt đầu bằng https://" },
                    ]}
                    className="social-url"
                    style={{ marginBottom: 0 }}
                  >
                    <Input maxLength={300} placeholder={urlHints[platform ?? "other"]} aria-label="Link" />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa mạng xã hội ${field.name + 1}`} onClick={() => remove(field.name)} className="ship-remove" />
                </div>
              );
            })}
            {!fields.length && <Typography.Text type="secondary">Chưa có mạng xã hội nào.</Typography.Text>}
            <Button
              icon={<PlusOutlined />}
              disabled={fields.length >= SOCIALS_MAX}
              onClick={() => add({ id: `social-${Date.now().toString(36)}`, platform: "facebook", label: "", url: "", enabled: true } satisfies Social)}
              style={{ alignSelf: "flex-start", marginTop: 4 }}
            >
              Thêm mạng xã hội
            </Button>
          </Flex>
        )}
      </Form.List>
    </FormSection>
  );
}
