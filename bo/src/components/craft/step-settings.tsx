import { DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Form, Input, InputNumber, Popconfirm, Radio, Row, Switch, Typography } from "antd";
import type { ReactNode } from "react";
import { IconPicker } from "@/components/craft/step-icon";
import { MoneyInput } from "@/components/money-input";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { DEFAULT_INTENSITY, intensityLabels, kindMeta, previewRoleMeta } from "@/lib/craft/steps";
import type { BlendStep, CraftStep, IntensityLevel, Localized } from "@/lib/craft/types";

const levels: IntensityLevel[] = ["light", "medium", "strong"];

// Hàng cài đặt: nhãn + mô tả bên trái, điều khiển bên phải
function Setting({ label, description, children }: { label: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Flex justify="space-between" align="center" gap={16} wrap style={{ padding: "12px 0", borderBottom: "1px solid #f1f1f1" }}>
      <Flex vertical style={{ minWidth: 200, flex: 1 }}>
        <Typography.Text strong>{label}</Typography.Text>
        {description && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {description}
          </Typography.Text>
        )}
      </Flex>
      {children}
    </Flex>
  );
}

// Cài đặt một bước — sửa trực tiếp vào bản nháp, lên web khi bấm Lưu trên trang
export function StepSettings({ step, api, onRemoved }: { step: CraftStep; api: CraftConfigApi; onRemoved: () => void }) {
  const set = (patch: Partial<CraftStep>) => api.updateStep(step.id, (s) => ({ ...s, ...patch }) as CraftStep);
  const text = (key: "title" | "hint", lang: keyof Localized, value: string) => {
    const prev = step[key] ?? { vi: "", en: "" };
    set({ [key]: { ...prev, [lang]: value } });
  };
  const isVessel = step.kind === "vessel";

  return (
    <Flex vertical gap={16}>
      <Card title="Thông tin hiển thị" size="small" className="inner-card" styles={{ body: { paddingTop: 8 } }}>
        <Form layout="vertical" component="div">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Tên bước (Tiếng Việt)" required validateStatus={step.title.vi.trim() ? undefined : "error"} help={step.title.vi.trim() ? undefined : "Cần có tên."}>
                <Input value={step.title.vi} maxLength={40} onChange={(e) => text("title", "vi", e.target.value)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tên bước (English)">
                <Input value={step.title.en} maxLength={40} onChange={(e) => text("title", "en", e.target.value)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Mô tả ngắn (VI)" extra="Dòng nhỏ dưới tên bước trên web.">
                <Input value={step.hint?.vi} maxLength={90} placeholder="VD: Chọn loại sáp nền" onChange={(e) => text("hint", "vi", e.target.value)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Mô tả ngắn (EN)">
                <Input value={step.hint?.en} maxLength={90} onChange={(e) => text("hint", "en", e.target.value)} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Icon" style={{ marginBottom: 8 }}>
            <IconPicker value={step.icon} onChange={(icon) => set({ icon })} />
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Mã bước: <Typography.Text code copyable>{step.id}</Typography.Text> — cố định sau khi tạo (đơn hàng và quy tắc tương thích dùng mã này).
          </Typography.Text>
        </Form>
      </Card>

      <Card title="Cách hoạt động" size="small" className="inner-card" styles={{ body: { paddingTop: 0, paddingBottom: 4 } }}>
        <Setting label="Hiện trên web" description={isVessel ? "Bước hũ quyết định giá gốc nên luôn hiện." : "Tắt để ẩn bước khỏi trang Thủ công, giữ nguyên dữ liệu."}>
          <Switch checked={step.enabled} disabled={isVessel} onChange={(enabled) => set({ enabled })} aria-label="Hiện trên web" />
        </Setting>
        <Setting
          label="Bắt buộc"
          description={step.kind === "inputs" ? "Khách phải nhập ít nhất một ô trước khi thêm vào giỏ." : "Khách phải chọn trước khi thêm vào giỏ."}
        >
          <Switch checked={step.required} disabled={isVessel} onChange={(required) => set({ required })} aria-label="Bắt buộc" />
        </Setting>

        {step.kind === "cards" && (
          <>
            <Setting label="Cho chọn nhiều" description="Khách tích được nhiều thẻ (vd nhiều phụ kiện).">
              <Flex gap={8} align="center">
                {step.multiple && (
                  <InputNumber
                    aria-label="Chọn tối đa"
                    min={2}
                    precision={0}
                    placeholder="Không giới hạn"
                    prefix="Tối đa"
                    value={step.maxSelect}
                    onChange={(n) => set({ maxSelect: n ?? undefined })}
                    style={{ width: 170 }}
                  />
                )}
                <Switch checked={step.multiple} onChange={(multiple) => set({ multiple, maxSelect: multiple ? step.maxSelect : undefined })} aria-label="Cho chọn nhiều" />
              </Flex>
            </Setting>
          </>
        )}

        {step.kind === "blend" && <BlendSettings step={step} set={set} />}

        {(step.kind === "cards" || step.kind === "swatches") && (
          <>
            <Setting label="Ảnh minh họa trên web" description={step.previewRole ? previewRoleMeta[step.previewRole].hint : "Bước này không làm đổi ảnh minh họa cây nến."}>
              <Radio.Group
                optionType="button"
                value={step.previewRole ?? "none"}
                onChange={(e) => set({ previewRole: e.target.value === "none" ? undefined : e.target.value })}
                options={[{ value: "none", label: "Không" }, ...kindMeta[step.kind].roles.map((r) => ({ value: r, label: previewRoleMeta[r].label }))]}
              />
            </Setting>
            <Setting
              label="Lượng nguyên liệu mỗi hũ"
              description="Với nguyên liệu tính theo gram / ml trong Kho: mỗi hũ dùng (hệ số × lượng sáp đổ của cỡ). Vd sáp hệ số 1: cỡ đổ 120g trừ 120g. Nguyên liệu tính theo cái luôn trừ 1."
            >
              <InputNumber
                aria-label="Hệ số gram"
                min={0}
                step={0.1}
                prefix="Hệ số"
                value={step.gramsPerGram ?? 1}
                onChange={(n) => n !== null && set({ gramsPerGram: n })}
                style={{ width: 130 }}
              />
            </Setting>
          </>
        )}
      </Card>

      <Card size="small" title="Xóa bước" className="inner-card" styles={{ body: { paddingTop: 8 } }}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Typography.Text type="secondary" style={{ flex: 1, minWidth: 220 }}>
            {isVessel
              ? "Không xóa được bước hũ — mỗi cấu hình cần đúng một bước hũ để tính giá gốc."
              : "Xóa cả bước và các lựa chọn bên trong. Đơn hàng cũ vẫn giữ mô tả đã lưu."}
          </Typography.Text>
          <Popconfirm
            title={`Xóa bước “${step.title.vi}”?`}
            description="Không thể hoàn tác. Các quy tắc “chỉ dùng với” trỏ tới bước này cũng bị gỡ."
            okText="Xóa bước"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            disabled={isVessel}
            onConfirm={() => {
              api.removeStep(step.id);
              onRemoved();
            }}
          >
            <Button danger icon={<DeleteOutlined />} disabled={isVessel}>
              Xóa bước
            </Button>
          </Popconfirm>
        </Flex>
      </Card>
    </Flex>
  );
}

function BlendSettings({ step, set }: { step: BlendStep; set: (patch: Partial<BlendStep>) => void }) {
  const { intensity } = step;
  return (
    <>
      <Setting label="Số mục phối tối đa mỗi hũ" description="1 = khách chỉ chọn một mục, không có thanh chỉnh tỉ lệ.">
        <Radio.Group
          optionType="button"
          value={step.maxBlend}
          onChange={(e) => set({ maxBlend: e.target.value })}
          options={[1, 2, 3, 4].map((n) => ({ value: n, label: n === 1 ? "1 mục" : `Tối đa ${n}` }))}
        />
      </Setting>
      <Setting label="Cho chọn độ đậm" description="Nhẹ / Vừa / Đậm — tỉ lệ (gram tinh dầu / gram sáp) quyết định lượng trừ kho.">
        <Switch checked={!!intensity} onChange={(v) => set({ intensity: v ? DEFAULT_INTENSITY : null })} aria-label="Cho chọn độ đậm" />
      </Setting>
      {intensity && (
        <Row gutter={[12, 12]} style={{ padding: "12px 0" }}>
          {levels.map((level) => (
            <Col key={level} xs={24} sm={8}>
              <Card size="small" title={intensityLabels[level]} className="inner-card">
                <Form layout="vertical" component="div">
                  <Form.Item label="Tỉ lệ hương">
                    <InputNumber
                      min={0}
                      step={0.5}
                      suffix="%"
                      style={{ width: "100%" }}
                      value={Math.round(intensity.load[level] * 1000) / 10}
                      onChange={(n) => n !== null && set({ intensity: { ...intensity, load: { ...intensity.load, [level]: n / 100 } } })}
                    />
                  </Form.Item>
                  <Form.Item label="Phụ thu" style={{ marginBottom: 0 }}>
                    <MoneyInput
                      value={intensity.priceDelta[level]}
                      onChange={(n) => n !== null && set({ intensity: { ...intensity, priceDelta: { ...intensity.priceDelta, [level]: n } } })}
                    />
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}
