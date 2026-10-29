import { Card, Col, Divider, Flex, Form, InputNumber, Radio, Row, Switch, Typography } from "antd";
import { MoneyInput } from "@/components/money-input";
import type { CraftCatalogApi } from "@/hooks/use-craft-catalog";
import { intensities, type CustomizerCatalog, type Intensity, type PersonalizationConfig, type TextField } from "@/lib/craft/types";

const intensityLabels: Record<Intensity, string> = { light: "Nhẹ", medium: "Vừa", strong: "Đậm" };
const DEFAULT_INTENSITY: NonNullable<CustomizerCatalog["intensity"]> = {
  priceDelta: { light: 0, medium: 0, strong: 50 },
  load: { light: 0.06, medium: 0.08, strong: 0.1 },
};

const textFields: { key: "labelText" | "recipientName" | "giftMessage"; label: string }[] = [
  { key: "labelText", label: "Chữ in trên nhãn" },
  { key: "recipientName", label: "Tên người nhận" },
  { key: "giftMessage", label: "Lời nhắn kèm quà" },
];

// Quy tắc phối hương + các tùy chọn cá nhân hóa; mọi thay đổi lưu ngay
export function RulesPanel({ api }: { api: CraftCatalogApi }) {
  const { maxFragrances, intensity, personalization } = api.catalog;
  const setP = (patch: Partial<PersonalizationConfig>) =>
    api.update((c) => ({ ...c, personalization: { ...c.personalization, ...patch } }));
  const setText = (key: (typeof textFields)[number]["key"], patch: Partial<TextField>) =>
    setP({ [key]: { ...personalization[key], ...patch } });
  const setIntensity = (next: NonNullable<CustomizerCatalog["intensity"]> | null) => api.update((c) => ({ ...c, intensity: next }));
  const giftBox = personalization.giftBox;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card title="Phối hương" style={{ height: "100%" }}>
          <Form layout="vertical" component="div">
            <Form.Item label="Số mùi tối đa mỗi hũ">
              <Radio.Group
                optionType="button"
                value={maxFragrances}
                onChange={(e) => api.update((c) => ({ ...c, maxFragrances: e.target.value }))}
                options={[1, 2, 3].map((n) => ({ value: n, label: n === 1 ? "1 mùi" : `Tối đa ${n}` }))}
              />
            </Form.Item>
            <Form.Item label="Cho chọn độ đậm hương" extra="Nhẹ / Vừa / Đậm — tỉ lệ tinh dầu trên khối lượng sáp">
              <Switch checked={!!intensity} onChange={(v) => setIntensity(v ? DEFAULT_INTENSITY : null)} />
            </Form.Item>
            {intensity && (
              <Row gutter={12}>
                {intensities.map((level) => (
                  <Col key={level} xs={24} sm={8}>
                    <Card size="small" title={intensityLabels[level]}>
                      <Form.Item label="Tỉ lệ hương">
                        <InputNumber
                          min={0}
                          step={0.5}
                          suffix="%"
                          style={{ width: "100%" }}
                          value={Math.round(intensity.load[level] * 1000) / 10}
                          onChange={(n) => setIntensity({ ...intensity, load: { ...intensity.load, [level]: (n ?? 0) / 100 } })}
                        />
                      </Form.Item>
                      <Form.Item label="Phụ thu" style={{ marginBottom: 0 }}>
                        <MoneyInput value={intensity.priceDelta[level]} onChange={(n) => setIntensity({ ...intensity, priceDelta: { ...intensity.priceDelta, [level]: n ?? 0 } })} />
                      </Form.Item>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={12}>
        <Card title="Cá nhân hóa" style={{ height: "100%" }}>
          <Form layout="vertical" component="div">
            {textFields.map(({ key, label }, i) => {
              const f = personalization[key];
              return (
                <div key={key}>
                  {i > 0 && <Divider style={{ margin: "8px 0 16px" }} />}
                  <Flex justify="space-between" align="center" style={{ marginBottom: f.enabled ? 12 : 0 }}>
                    <Typography.Text strong>{label}</Typography.Text>
                    <Switch checked={f.enabled} onChange={(v) => setText(key, { enabled: v })} aria-label={label} />
                  </Flex>
                  {f.enabled && (
                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item label="Số ký tự tối đa">
                          <InputNumber min={1} precision={0} style={{ width: "100%" }} value={f.maxLength} onChange={(n) => setText(key, { maxLength: n ?? 1 })} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Phụ thu">
                          <MoneyInput value={f.priceDelta} onChange={(n) => setText(key, { priceDelta: n ?? 0 })} />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                </div>
              );
            })}
            <Divider style={{ margin: "8px 0 16px" }} />
            <Flex justify="space-between" align="center" style={{ marginBottom: giftBox?.enabled ? 12 : 0 }}>
              <Typography.Text strong>Hộp quà</Typography.Text>
              <Switch
                aria-label="Hộp quà"
                checked={!!giftBox?.enabled}
                onChange={(v) => setP({ giftBox: giftBox ? { ...giftBox, enabled: v } : { enabled: true, available: true, priceDelta: 0, stock: 0, unit: "pcs" } })}
              />
            </Flex>
            {giftBox?.enabled && (
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Phụ thu">
                    <MoneyInput value={giftBox.priceDelta} onChange={(n) => setP({ giftBox: { ...giftBox, priceDelta: n ?? 0 } })} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Tồn kho">
                    <InputNumber min={0} precision={0} suffix="cái" style={{ width: "100%" }} value={giftBox.stock} onChange={(n) => setP({ giftBox: { ...giftBox, stock: n ?? 0 } })} />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
