import { App, Form, Input, Modal } from "antd";
import { ImageUpload } from "@/components/form/image-upload";
import { MoneyInput } from "@/components/money-input";
import type { OrdersApi } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import { overpaid, paidAmount } from "@/lib/orders/labels";
import type { Order, Refund } from "@/lib/orders/types";

type Values = Pick<Refund, "amount" | "images" | "note">;
// overpaid: hoàn phần khách trả dư sau khi sửa đơn bớt hàng; không có = hoàn khi hủy đơn
type Props = { open: boolean; order: Order; api: OrdersApi; onClose: () => void; overpaid?: boolean };

// Ghi nhận đã hoàn tiền: bắt buộc có ảnh chứng từ
export function RefundModal({ open, order, api, onClose, overpaid: extra }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const paid = extra ? overpaid(order) : paidAmount(order);

  const finish = (v: Values) => {
    const refund = { amount: Math.round(v.amount), images: v.images, note: v.note?.trim() || undefined };
    if (!(extra ? api.refundPart(order.id, refund) : api.recordRefund(order.id, refund))) return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    message.success(`Đã ghi nhận hoàn ${formatMoney(v.amount)}`);
    onClose();
  };

  return (
    <Modal open={open} title={`Ghi nhận hoàn tiền đơn ${order.code}`} okText="Ghi nhận" cancelText="Quay lại" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={{ amount: extra ? paid : order.refundDue, images: [] }} onFinish={finish}>
        <Form.Item name="amount" label="Số tiền đã hoàn" rules={[{ required: true, type: "number", min: 1000, max: paid, message: `Nhập số tiền, tối đa ${formatMoney(paid)}.` }]}>
          <MoneyInput />
        </Form.Item>
        <Form.Item name="images" label="Ảnh chứng từ" rules={[{ required: true, type: "array", min: 1, message: "Thêm ít nhất một ảnh chứng từ." }]}>
          <ImageUpload />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú" style={{ marginBottom: 0 }}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="VD: Chuyển khoản Vietcombank, mã giao dịch…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
