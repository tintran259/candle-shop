import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Col, Empty, Flex, Form, Input, InputNumber, Popconfirm, Row, Switch, Typography } from "antd";
import { MoneyInput } from "@/components/money-input";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { UNLIMITED } from "@/lib/craft/groups";
import { uniqueId } from "@/lib/craft/steps";
import type { AddonDef, CraftStep, InputsStep, Localized, TextFieldDef } from "@/lib/craft/types";

// Ô nhập chữ + tuỳ chọn bật/tắt của bước "Ô nhập & tuỳ chọn thêm" — sửa trực tiếp, lưu ngay
export function InputsEditor({ step, api }: { step: InputsStep; api: CraftConfigApi }) {
  const update = (fn: (s: InputsStep) => InputsStep) => api.updateStep(step.id, (s) => (s.kind === "inputs" ? fn(s) : s) as CraftStep);
  const patchField = (id: string, p: Partial<TextFieldDef>) => update((s) => ({ ...s, fields: s.fields.map((f) => (f.id === id ? { ...f, ...p } : f)) }));
  const patchAddon = (id: string, p: Partial<AddonDef>) => update((s) => ({ ...s, addons: s.addons.map((a) => (a.id === id ? { ...a, ...p } : a)) }));
  const ids = [...step.fields.map((f) => f.id), ...step.addons.map((a) => a.id)];

  const addField = () =>
    update((s) => ({
      ...s,
      fields: [...s.fields, { id: uniqueId("field", ids), label: { vi: "Ô nhập mới", en: "New field" }, maxLength: 30, priceDelta: 0, enabled: true }],
    }));
  const addAddon = () =>
    update((s) => ({
      ...s,
      addons: [...s.addons, { id: uniqueId("addon", ids), name: { vi: "Tuỳ chọn mới", en: "New add-on" }, priceDelta: 0, available: true, enabled: true, stock: UNLIMITED, unit: "pcs" }],
    }));

  return (
    <Flex vertical gap={24}>
      <section aria-label="Ô nhập chữ">
        <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 12 }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Ô nhập chữ
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Khách gõ nội dung (in nhãn, tên người nhận, lời nhắn). Tính phụ thu khi khách có nhập.
            </Typography.Text>
          </div>
          <Button icon={<PlusOutlined />} onClick={addField}>
            Thêm ô nhập
          </Button>
        </Flex>
        <Flex vertical gap={12}>
          {step.fields.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ô nhập nào." />}
          {step.fields.map((f) => (
            <Card key={f.id} size="small" className="inner-card" style={{ opacity: f.enabled ? 1 : 0.65 }}>
              <Form layout="vertical" component="div">
                <Row gutter={12}>
                  <LocalizedInputs label="Nhãn ô" value={f.label} onChange={(label) => patchField(f.id, { label })} />
                  <LocalizedInputs
                    label="Chữ gợi ý"
                    value={f.placeholder ?? { vi: "", en: "" }}
                    onChange={(placeholder) => patchField(f.id, { placeholder: placeholder.vi || placeholder.en ? placeholder : undefined })}
                    optional
                  />
                  <Col xs={12} md={6}>
                    <Form.Item label="Tối đa">
                      <InputNumber min={1} max={500} precision={0} suffix="ký tự" value={f.maxLength} onChange={(n) => patchField(f.id, { maxLength: n ?? 1 })} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item label="Phụ thu khi nhập">
                      <MoneyInput value={f.priceDelta} onChange={(n) => patchField(f.id, { priceDelta: n ?? 0 })} />
                    </Form.Item>
                  </Col>
                </Row>
                <Flex justify="space-between" align="center" gap={12} wrap>
                  <Flex gap={16} wrap>
                    <Checkbox checked={!!f.multiline} onChange={(e) => patchField(f.id, { multiline: e.target.checked || undefined })}>
                      Ô nhiều dòng
                    </Checkbox>
                    <Checkbox checked={!!f.onLabel} onChange={(e) => patchField(f.id, { onLabel: e.target.checked || undefined })}>
                      In lên nhãn trong ảnh minh họa
                    </Checkbox>
                  </Flex>
                  <Flex gap={8} align="center">
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Mã: <Typography.Text code>{f.id}</Typography.Text>
                    </Typography.Text>
                    <Switch size="small" checked={f.enabled} onChange={(enabled) => patchField(f.id, { enabled })} aria-label={`Hiện ô ${f.label.vi}`} />
                    <Popconfirm title={`Xóa ô “${f.label.vi}”?`} okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => update((s) => ({ ...s, fields: s.fields.filter((x) => x.id !== f.id) }))}>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} aria-label={`Xóa ô ${f.label.vi}`} />
                    </Popconfirm>
                  </Flex>
                </Flex>
              </Form>
            </Card>
          ))}
        </Flex>
      </section>

      <section aria-label="Tuỳ chọn thêm">
        <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 12 }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Tuỳ chọn thêm
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Mục khách tích chọn (hộp quà, thiệp…). Có tồn kho riêng.
            </Typography.Text>
          </div>
          <Button icon={<PlusOutlined />} onClick={addAddon}>
            Thêm tuỳ chọn
          </Button>
        </Flex>
        <Flex vertical gap={12}>
          {step.addons.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tuỳ chọn nào." />}
          {step.addons.map((a) => {
            const unlimited = a.stock >= UNLIMITED;
            return (
              <Card key={a.id} size="small" className="inner-card" style={{ opacity: a.enabled ? 1 : 0.65 }}>
                <Form layout="vertical" component="div">
                  <Row gutter={12}>
                    <LocalizedInputs label="Tên" value={a.name} onChange={(name) => patchAddon(a.id, { name })} />
                    <LocalizedInputs
                      label="Mô tả"
                      value={a.description ?? { vi: "", en: "" }}
                      onChange={(d) => patchAddon(a.id, { description: d.vi || d.en ? d : undefined })}
                      optional
                    />
                    <Col xs={12} md={6}>
                      <Form.Item label="Phụ thu">
                        <MoneyInput value={a.priceDelta} onChange={(n) => patchAddon(a.id, { priceDelta: n ?? 0 })} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Item label="Tồn kho">
                        <InputNumber
                          min={0}
                          precision={0}
                          suffix="cái"
                          disabled={unlimited}
                          placeholder={unlimited ? "Không theo dõi" : undefined}
                          value={unlimited ? undefined : a.stock}
                          onChange={(n) => patchAddon(a.id, { stock: n ?? 0 })}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Flex justify="space-between" align="center" gap={12} wrap>
                    <Flex gap={16} wrap>
                      <Checkbox checked={unlimited} onChange={(e) => patchAddon(a.id, { stock: e.target.checked ? UNLIMITED : 0 })}>
                        Không theo dõi tồn kho
                      </Checkbox>
                      <Checkbox checked={a.available} onChange={(e) => patchAddon(a.id, { available: e.target.checked })}>
                        Đang bán
                      </Checkbox>
                    </Flex>
                    <Flex gap={8} align="center">
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Mã: <Typography.Text code>{a.id}</Typography.Text>
                      </Typography.Text>
                      <Switch size="small" checked={a.enabled} onChange={(enabled) => patchAddon(a.id, { enabled })} aria-label={`Hiện ${a.name.vi}`} />
                      <Popconfirm title={`Xóa “${a.name.vi}”?`} okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => update((s) => ({ ...s, addons: s.addons.filter((x) => x.id !== a.id) }))}>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} aria-label={`Xóa ${a.name.vi}`} />
                      </Popconfirm>
                    </Flex>
                  </Flex>
                </Form>
              </Card>
            );
          })}
        </Flex>
      </section>
    </Flex>
  );
}

// Cặp ô VI / EN cho một chữ hiển thị
function LocalizedInputs({ label, value, onChange, optional }: { label: string; value: Localized; onChange: (v: Localized) => void; optional?: boolean }) {
  return (
    <>
      <Col xs={24} md={12} lg={6}>
        <Form.Item label={`${label} (VI)`} required={!optional}>
          <Input value={value.vi} maxLength={60} onChange={(e) => onChange({ ...value, vi: e.target.value })} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12} lg={6}>
        <Form.Item label={`${label} (EN)`}>
          <Input value={value.en} maxLength={60} onChange={(e) => onChange({ ...value, en: e.target.value })} />
        </Form.Item>
      </Col>
    </>
  );
}
