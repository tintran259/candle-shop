import { OrderedListOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Form, InputNumber, Popconfirm, Row, Typography } from "antd";
import { LADDER, missingLadder, withLadder } from "@/lib/color-mix/ladder";
import { DEFAULT_WATER, type MixMode, type MixSet } from "@/lib/color-mix/types";
import { CollectGuide } from "./collect-guide";
import { ColorField } from "./color-field";
import { PigmentCard } from "./pigment-card";

const newId = (mode: MixMode) => `${mode === "oxide" ? "ox" : "lq"}-${Math.random().toString(36).slice(2, 8)}`;

// Tab Dữ liệu mẫu: mẫu trắng, thông số màu nước, các màu cơ bản và mẫu đổ thử (docs/pages/color-mix.md#dữ-liệu-mẫu)
// update(fn, false): thêm dòng mẫu trống không bỏ nhãn "dữ liệu minh họa" (chưa có màu đo thật)
export function DataPanel({ mode, set, update }: { mode: MixMode; set: MixSet; update: (fn: (s: MixSet) => MixSet, touch?: boolean) => void }) {
  const term = mode === "oxide" ? "màu oxit" : "màu nước";
  const missing = set.pigments.reduce((n, p) => n + missingLadder(p).length, 0);
  const ladderText = LADDER.map((c) => `${c.toLocaleString("vi-VN")}%`).join(" · ");
  return (
    <Flex vertical gap={16}>
      <CollectGuide mode={mode} />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={mode === "liquid" ? 10 : 24}>
          <Card title="Mẫu trắng (bột + nước, không màu, đã khô)" style={{ height: "100%" }}>
            <Flex vertical gap={16}>
              <ColorField label="Màu mẫu trắng" value={set.base} onChange={(hex) => update((s) => ({ ...s, base: hex }))} />
              <Form layout="vertical" component="div">
                <Form.Item
                  label="Nước khi đổ mẫu (ml / 100 g tổng bột)"
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
                    <Form.Item label="Nước có sẵn trong màu (%)">
                      <InputNumber min={0} max={100} value={set.waterContent ?? 50} onChange={(v) => update((s) => ({ ...s, waterContent: v ?? 0 }))} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Thể tích 1 giọt (ml)">
                      <InputNumber min={0} step={0.005} value={set.dropGrams ?? 0.05} onChange={(v) => update((s) => ({ ...s, dropGrams: v ?? 0 }))} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
              <Typography.Text type="secondary">
                Đo 1 giọt: nhỏ 20 giọt vào xi-lanh / ống đong rồi chia 20 (thường khoảng 0,05 ml). Màu nước tính theo ml, coi 1 ml ≈ 1 g. Nước có sẵn thường in trên bao bì, không có thì để khoảng 50%.
              </Typography.Text>
            </Card>
          </Col>
        )}
      </Row>

      <Card
        title={`Mẫu từng ${term}`}
        extra={
          missing > 0 && (
            <Popconfirm
              title={`Thêm ${missing} dòng mẫu?`}
              description={`Mỗi màu thêm các nồng độ còn thiếu (${ladderText}) trên 50 g thạch cao, chưa có màu đo — đổ mẫu xong nhập màu.`}
              okText="Thêm"
              cancelText="Hủy"
              onConfirm={() => update((s) => ({ ...s, pigments: s.pigments.map(withLadder) }), false)}
            >
              <Button icon={<OrderedListOutlined />}>Thêm thang chuẩn</Button>
            </Popconfirm>
          )
        }
      >
        <Flex vertical gap={12}>
          {set.pigments.map((p) => (
            <PigmentCard
              key={p.id}
              mode={mode}
              set={set}
              pigment={p}
              onChange={(next, touch) => update((s) => ({ ...s, pigments: s.pigments.map((x) => (x.id === p.id ? next : x)) }), touch)}
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
