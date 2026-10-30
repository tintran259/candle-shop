import { CheckCircleFilled } from "@ant-design/icons";
import { Col, Flex, Form, Input, Modal, Row, Typography } from "antd";
import { useState } from "react";
import { KindThumb } from "@/components/craft/kind-thumb";
import { kindMeta } from "@/lib/craft/steps";
import { stepKinds, type StepKind } from "@/lib/craft/types";
import { brand, radius } from "@/theme";

type Props = { open: boolean; hasVessel: boolean; onCancel: () => void; onCreate: (kind: StepKind, title: string) => void };

// Thêm bước: chọn component (thẻ có hình minh họa) rồi đặt tên. Bước mới ẩn với khách cho tới khi bật.
export function AddStepModal({ open, hasVessel, onCancel, onCreate }: Props) {
  const [kind, setKind] = useState<StepKind>("cards");
  const [form] = Form.useForm<{ title: string }>();

  return (
    <Modal
      open={open}
      title="Thêm bước"
      okText="Tạo bước"
      cancelText="Hủy"
      width={760}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      afterOpenChange={(o) => o && setKind("cards")}
    >
      <Typography.Paragraph type="secondary">
        Mỗi bước dùng một component. Khách đi qua các bước theo thứ tự bạn sắp xếp. Bước mới sẽ ẩn cho tới khi bạn bật lên.
      </Typography.Paragraph>
      <Row gutter={[12, 12]} role="radiogroup" aria-label="Component của bước">
        {stepKinds.map((k) => {
          const meta = kindMeta[k];
          const disabled = k === "vessel" && hasVessel;
          const selected = k === kind;
          return (
            <Col key={k} xs={24} sm={12} md={8}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => setKind(k)}
                className="kind-card"
                style={{
                  borderColor: selected ? brand.ember : undefined,
                  boxShadow: selected ? `0 0 0 1px ${brand.ember}` : undefined,
                  borderRadius: radius.inner + 4,
                }}
              >
                <KindThumb kind={k} />
                <Flex justify="space-between" align="center" style={{ marginTop: 10 }}>
                  <Typography.Text strong>{meta.label}</Typography.Text>
                  {selected && <CheckCircleFilled style={{ color: brand.ember }} aria-hidden />}
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
                  {disabled ? "Đã có bước hũ — mỗi cấu hình chỉ có một." : meta.description}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, display: "block", marginTop: 6, color: brand.emberDark }}>
                  VD: {meta.example}
                </Typography.Text>
              </button>
            </Col>
          );
        })}
      </Row>
      <Form form={form} layout="vertical" onFinish={(v) => onCreate(kind, v.title.trim())} style={{ marginTop: 20 }} preserve={false}>
        <Form.Item
          name="title"
          label="Tên bước (khách sẽ thấy)"
          rules={[{ required: true, whitespace: true, message: "Đặt tên cho bước." }]}
          extra="Sửa tên tiếng Anh, mô tả và icon trong phần Cài đặt sau khi tạo."
          style={{ marginBottom: 0 }}
        >
          <Input placeholder={`VD: ${kindMeta[kind].example.split(",")[0]}`} maxLength={40} autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}
