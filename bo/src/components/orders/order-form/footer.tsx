import { Button, Col, Flex, Form, Grid, Input, Row, Typography } from "antd";
import { FormSection } from "@/components/form/form-section";
import { formatMoney } from "@/lib/format";

type Props = {
  // Màn rộng đã có tóm tắt bên phải — chân drawer chỉ còn nút
  wide: boolean;
  total: number;
  editing: boolean;
  // Hủy (sửa đơn) / Lưu nháp (tạo đơn): đóng drawer
  onClose: () => void;
  // Bỏ đơn đang tạo
  onDiscard: () => void;
  onSubmit: () => void;
};

// Chân drawer Tạo / Sửa đơn: tổng đơn (màn hẹp), Hủy hoặc Bỏ đơn + Lưu nháp, nút Tạo đơn / Lưu thay đổi
export function OrderFormFooter({ wide, total, editing, onClose, onDiscard, onSubmit }: Props) {
  return (
    <Flex gap={12} align="center" wrap>
      {!wide && (
        <Flex vertical style={{ marginRight: "auto" }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Tổng đơn
          </Typography.Text>
          <Typography.Text strong className="tabular" style={{ fontSize: 18 }}>
            {formatMoney(total)}
          </Typography.Text>
        </Flex>
      )}
      {editing ? (
        <Button onClick={onClose} style={wide ? { marginLeft: "auto" } : undefined}>
          Hủy
        </Button>
      ) : (
        <>
          <Button type="text" danger onClick={onDiscard} style={wide ? { marginLeft: "auto" } : undefined}>
            Bỏ đơn
          </Button>
          <Button onClick={onClose}>Lưu nháp</Button>
        </>
      )}
      <Button type="primary" onClick={onSubmit}>
        {editing ? "Lưu thay đổi" : "Tạo đơn"} · {formatMoney(total)}
      </Button>
    </Flex>
  );
}

// Khối Ghi chú: ghi chú của khách và ghi chú nội bộ
export function NoteFields() {
  const screens = Grid.useBreakpoint();
  return (
    <FormSection title="Ghi chú">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="note" label="Ghi chú của khách" style={{ marginBottom: screens.md ? 0 : undefined }}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={300} placeholder="VD: Gói quà, giao giờ hành chính…" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="internalNote" label="Ghi chú nội bộ" style={{ marginBottom: 0 }}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={300} placeholder="Chỉ shop thấy" />
          </Form.Item>
        </Col>
      </Row>
    </FormSection>
  );
}
