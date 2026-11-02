import { Alert, Form, Input, Modal, Radio } from "antd";
import { MoneyInput } from "@/components/money-input";
import { returnConditionLabels } from "@/lib/orders/labels";
import type { Order, ReturnCondition } from "@/lib/orders/types";

type Base = { open: boolean; order: Order; onClose: () => void };

export function DeliveryFailModal({ open, order, max, onClose, onConfirm }: Base & { max: number; onConfirm: (reason: string) => void }) {
  const [form] = Form.useForm<{ reason: string }>();
  const attempt = (order.deliveryAttempts ?? 0) + 1;
  return (
    <Modal open={open} title={`Giao không thành đơn ${order.code}`} okText="Ghi nhận" cancelText="Quay lại" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Alert
        type={attempt >= max ? "warning" : "info"}
        showIcon
        style={{ marginBottom: 16 }}
        title={`Lần giao ${attempt}/${max}`}
        description={attempt >= max ? "Đây là lần cuối, đơn sẽ tự chuyển sang hoàn về." : "Sau khi ghi nhận, bạn chọn giao lại hoặc hoàn về."}
      />
      <Form form={form} layout="vertical" onFinish={(v) => onConfirm(v.reason.trim())}>
        <Form.Item name="reason" label="Lý do" rules={[{ required: true, whitespace: true, message: "Nhập lý do giao không thành." }]} style={{ marginBottom: 0 }}>
          <Input.TextArea autoFocus autoSize={{ minRows: 2, maxRows: 4 }} placeholder="VD: Khách không nghe máy, sai địa chỉ…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function ReceiveBackModal({ open, order, onClose, onConfirm }: Base & { onConfirm: (condition: ReturnCondition, note?: string) => void }) {
  const [form] = Form.useForm<{ condition: ReturnCondition; note?: string }>();
  return (
    <Modal open={open} title={`Đã nhận lại đơn ${order.code}`} okText="Xác nhận" cancelText="Quay lại" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={(v) => onConfirm(v.condition, v.note?.trim() || undefined)}>
        <Form.Item name="condition" label="Tình trạng nến" rules={[{ required: true, message: "Chọn tình trạng nến." }]}>
          <Radio.Group vertical options={(["good", "damaged"] as const).map((value) => ({ value, label: returnConditionLabels[value] }))} />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú" extra="Nến hỏng chỉ ghi vào đơn, không tạo phiếu Kho." style={{ marginBottom: 0 }}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="VD: Vỡ hũ, nứt mặt sáp…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function ResendModal({ open, order, fee, onClose, onConfirm }: Base & { fee: number; onConfirm: (fee: number) => void }) {
  const [form] = Form.useForm<{ fee: number }>();
  return (
    <Modal open={open} title={`Gửi lại đơn ${order.code}?`} okText="Gửi lại đơn" cancelText="Quay lại" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      {order.returnCondition === "damaged" && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} title="Nến đã ghi nhận hỏng" description="Kiểm tra lại hoặc thay nến trước khi gửi." />
      )}
      <Form form={form} layout="vertical" initialValues={{ fee }} onFinish={(v) => onConfirm(Math.round(v.fee))}>
        <Form.Item name="fee" label="Phí gửi lại" extra="Cộng vào tổng đơn, thu khi khách nhận hàng." rules={[{ required: true, type: "number", min: 0, message: "Nhập phí gửi lại." }]} style={{ marginBottom: 0 }}>
          <MoneyInput />
        </Form.Item>
      </Form>
    </Modal>
  );
}
