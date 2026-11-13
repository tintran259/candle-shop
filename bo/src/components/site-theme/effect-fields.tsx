import { Col, Form, Row, Select, Switch } from "antd";
import { FormSection } from "@/components/form/form-section";
import { effectLabels, type EffectKind, type EffectTheme } from "@/lib/site-theme/blocks";

// Hiệu ứng dịp lễ trên hero (web: fe/src/components/effects/): công tắc bật + kiểu (tuyết / hoa mai, đào / tim).
// Giao diện concept chưa bật / tắt hoặc chưa chọn kiểu thì theo Mặc định. Khách tắt được bằng nút tròn ở góc hero (trình duyệt nhớ)
export function EffectFields({ isBase, fallback }: { isBase: boolean; fallback?: EffectTheme }) {
  // Bật mà chưa có kiểu (của mình hoặc của Mặc định) thì web không hiện gì — nhắc ngay dưới ô
  const enabled: boolean | undefined = Form.useWatch(["effect", "enabled"]);
  const kind: EffectKind | undefined = Form.useWatch(["effect", "kind"]);
  const missing = (enabled ?? fallback?.enabled) && !kind && !fallback?.kind;
  const options = (Object.keys(effectLabels) as EffectKind[]).map((k) => ({ value: k, label: effectLabels[k] }));
  return (
    <FormSection
      title="Hiệu ứng dịp lễ"
      description="Hạt rơi nhẹ trên ảnh hero (tuyết có thêm lớp tuyết đọng dưới đáy). Chỉ chạy ở hero, tắt trên máy bật “giảm chuyển động”; khách tắt được bằng nút tròn ở góc hero."
    >
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            name={["effect", "enabled"]}
            label="Bật hiệu ứng"
            valuePropName="checked"
            getValueProps={(v?: boolean) => ({ checked: v ?? fallback?.enabled ?? false })}
            extra={isBase ? undefined : "Chưa bật / tắt = theo Mặc định"}
          >
            <Switch aria-label="Bật hiệu ứng" />
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item
            name={["effect", "kind"]}
            label="Kiểu hiệu ứng"
            validateStatus={missing ? "warning" : undefined}
            help={missing ? "Chọn kiểu hiệu ứng — chưa chọn thì web không hiện hiệu ứng." : undefined}
          >
            <Select allowClear options={options} aria-label="Kiểu hiệu ứng" placeholder={fallback?.kind ? `Theo Mặc định: ${effectLabels[fallback.kind]}` : "Chọn kiểu"} />
          </Form.Item>
        </Col>
      </Row>
    </FormSection>
  );
}
