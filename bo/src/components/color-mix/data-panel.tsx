import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Form, InputNumber, Row, Typography } from "antd";
import { DEFAULT_WATER, type MixMode, type MixSet } from "@/lib/color-mix/types";
import { ColorField } from "./color-field";
import { PigmentCard } from "./pigment-card";

const newId = (mode: MixMode) => `${mode === "oxide" ? "ox" : "lq"}-${Math.random().toString(36).slice(2, 8)}`;

// Tab Dữ liệu mẫu: mẫu trắng, thông số màu nước, các màu cơ bản và mẫu đổ thử (docs/pages/color-mix.md#dữ-liệu-mẫu)
export function DataPanel({ mode, set, update }: { mode: MixMode; set: MixSet; update: (fn: (s: MixSet) => MixSet) => void }) {
  const term = mode === "oxide" ? "màu oxit" : "màu nước";
  return (
    <Flex vertical gap={16}>
      <Card title="Cách thu dữ liệu để kết quả sát nhất">
        <ol className="color-mix-steps">
          <li>Giữ cố định loại bột, tỷ lệ nước, thời gian khuấy cho mọi mẫu.</li>
          <li>Đổ một mẫu trắng (chỉ bột + nước) và mẫu cho từng {term}, ví dụ 50 g bột + 0,5 g màu. Mỗi màu đổ thêm 2–3 nồng độ (0,25 g, 1 g, 2 g) thì dự đoán sát hơn.</li>
          <li>Để khô hẳn (thường 24–48 giờ) — lúc ướt màu đậm hơn nhiều.</li>
          <li>Chụp các mẫu trong cùng một ảnh, ánh sáng ban ngày gián tiếp, không flash, rồi bấm nút máy ảnh để lấy màu. Có máy đo màu thì nhập mã hex trực tiếp.</li>
        </ol>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={mode === "liquid" ? 10 : 24}>
          <Card title="Mẫu trắng (bột + nước, không màu, đã khô)" style={{ height: "100%" }}>
            <Flex vertical gap={16}>
              <ColorField label="Màu mẫu trắng" value={set.base} onChange={(hex) => update((s) => ({ ...s, base: hex }))} />
              <Form layout="vertical" component="div">
                <Form.Item
                  label="Nước khi đổ mẫu (g / 100 g thạch cao)"
                  tooltip="Mẫu trắng và mọi mẫu đổ thử dùng cùng tỷ lệ nước này. Tab Pha màu cảnh báo khi pha khác tỷ lệ — nhiều nước thì thạch cao khô sáng hơn, ít nước thì đậm hơn."
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber min={1} value={set.waterPer100 ?? DEFAULT_WATER} onChange={(v) => update((s) => ({ ...s, waterPer100: v ?? DEFAULT_WATER }))} style={{ width: 160 }} />
                </Form.Item>
              </Form>
            </Flex>
          </Card>
        </Col>
        {mode === "liquid" && (
          <Col xs={24} md={14}>
            <Card title="Thông số màu nước" style={{ height: "100%" }}>
              <Form layout="vertical" component="div">
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Nước có sẵn trong màu (% khối lượng)">
                      <InputNumber min={0} max={100} value={set.waterContent ?? 50} onChange={(v) => update((s) => ({ ...s, waterContent: v ?? 0 }))} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Khối lượng 1 giọt (g)">
                      <InputNumber min={0} step={0.005} value={set.dropGrams ?? 0.05} onChange={(v) => update((s) => ({ ...s, dropGrams: v ?? 0 }))} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
              <Typography.Text type="secondary">Đo 1 giọt: nhỏ 20 giọt lên cân rồi chia 20. Nước có sẵn thường in trên bao bì, không có thì để khoảng 50%.</Typography.Text>
            </Card>
          </Col>
        )}
      </Row>

      <Card title={`Mẫu từng ${term}`}>
        <Flex vertical gap={12}>
          {set.pigments.map((p) => (
            <PigmentCard
              key={p.id}
              set={set}
              pigment={p}
              onChange={(next) => update((s) => ({ ...s, pigments: s.pigments.map((x) => (x.id === p.id ? next : x)) }))}
              onRemove={() =>
                update((s) => ({
                  ...s,
                  pigments: s.pigments.filter((x) => x.id !== p.id),
                  checks: s.checks.map((c) => ({ ...c, grams: Object.fromEntries(Object.entries(c.grams).filter(([id]) => id !== p.id)) })),
                }))
              }
            />
          ))}
          <div>
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                update((s) => ({ ...s, pigments: [...s.pigments, { id: newId(mode), name: mode === "oxide" ? "Màu oxit mới" : "Màu nước mới", samples: [{ plaster: 50, pigment: 0.5, hex: "" }] }] }))
              }
            >
              Thêm {term}
            </Button>
          </div>
        </Flex>
      </Card>
    </Flex>
  );
}
