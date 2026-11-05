import { Alert, Form, Input, Modal, Radio, Select, Typography, type FormInstance } from "antd";
import { MoneyInput } from "@/components/money-input";
import { formatMoney } from "@/lib/format";
import { returnConditionLabels } from "@/lib/orders/labels";
import { codAmount, normalizeTrackingCode, shipmentText, trackingOwner } from "@/lib/orders/shipping";
import type { Order, ReturnCondition, Shipment } from "@/lib/orders/types";
import { trackingLink, type Carrier } from "@/lib/settings/types";

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

export function ReceiveBackModal({ open, order, onClose, onConfirm }: Base & { onConfirm: (condition: ReturnCondition, note?: string, returnFee?: number) => void }) {
  const [form] = Form.useForm<{ condition: ReturnCondition; note?: string; returnFee?: number }>();
  return (
    <Modal open={open} title={`Đã nhận lại đơn ${order.code}`} okText="Xác nhận" cancelText="Quay lại" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={{ returnFee: 0 }} onFinish={(v) => onConfirm(v.condition, v.note?.trim() || undefined, Math.round(v.returnFee ?? 0))}>
        <Form.Item name="condition" label="Tình trạng nến" rules={[{ required: true, message: "Chọn tình trạng nến." }]}>
          <Radio.Group vertical options={(["good", "damaged"] as const).map((value) => ({ value, label: returnConditionLabels[value] }))} />
        </Form.Item>
        <Form.Item name="returnFee" label="Phí hoàn hàng trả đơn vị vận chuyển" extra="Chi phí của shop, trừ vào lãi. Không mất phí thì để 0." rules={[{ required: true, type: "number", min: 0, message: "Nhập phí hoàn hàng." }]}>
          <MoneyInput aria-label="Phí hoàn hàng" />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú" extra="Nến hỏng chỉ ghi vào đơn, không tạo phiếu Kho." style={{ marginBottom: 0 }}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="VD: Vỡ hũ, nứt mặt sáp…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// Chọn đơn vị và nhập mã vận đơn — dùng ở Giao cho vận chuyển, Sửa vận chuyển, Gửi lại đơn.
// previous: mã của lượt giao trước (gửi lại đơn), không cho dùng lại
function ShipFields({ form, order, orders, list, previous }: { form: FormInstance; order: Order; orders: Order[]; list: Carrier[]; previous?: string }) {
  const carrierId = Form.useWatch("carrierId", form);
  const carrier = list.find((c) => c.id === carrierId);
  return (
    <>
      <Form.Item name="carrierId" label="Đơn vị vận chuyển" rules={[{ required: true, message: "Chọn đơn vị vận chuyển." }]} extra={!list.length && "Chưa có đơn vị nào đang dùng — thêm ở Cài đặt › Đơn vị vận chuyển."}>
        <Select aria-label="Đơn vị vận chuyển" options={list.map((c) => ({ value: c.id, label: c.name }))} onChange={() => form.validateFields(["trackingCode"]).catch(() => undefined)} />
      </Form.Item>
      <Form.Item
        name="trackingCode"
        label="Mã vận đơn"
        normalize={(v?: string) => v?.toUpperCase()}
        extra={carrier && !carrier.requireCode ? "Không bắt buộc với đơn vị này." : "Mã trên app hoặc phiếu của đơn vị vận chuyển."}
        rules={[
          { required: !!carrier?.requireCode, whitespace: true, message: "Nhập mã vận đơn." },
          {
            validator: async (_, value?: string) => {
              const code = normalizeTrackingCode(value);
              if (previous && code === previous) throw new Error("Đây là mã của lượt giao trước — nhập mã mới.");
              const other = trackingOwner(orders, code, order.id);
              if (other) throw new Error(`Mã này đã dùng cho đơn ${other.code}.`);
            },
          },
        ]}
        style={{ marginBottom: 0 }}
      >
        <Input maxLength={40} placeholder="VD: GHN8XK2P4Q" aria-label="Mã vận đơn" />
      </Form.Item>
      <Form.Item
        name="cost"
        label="Phí trả đơn vị vận chuyển"
        extra={`Số shop trả bên vận chuyển cho lượt này — chi phí, trừ vào lãi. Khách trả phí giao ${formatMoney(order.shippingFee)}.`}
        rules={[{ required: true, type: "number", min: 0, message: "Nhập phí trả đơn vị vận chuyển." }]}
        style={{ marginTop: 16, marginBottom: 0 }}
      >
        <MoneyInput aria-label="Phí trả đơn vị vận chuyển" />
      </Form.Item>
    </>
  );
}

type ShipValues = { carrierId: string; trackingCode?: string; cost?: number };
const toShipment = (list: Carrier[], v: ShipValues, at = new Date().toISOString()): Shipment => {
  const c = list.find((x) => x.id === v.carrierId)!;
  const code = normalizeTrackingCode(v.trackingCode) || undefined;
  return { carrierId: c.id, carrier: c.name, trackingCode: code, trackingUrl: trackingLink(c.trackingUrl, code), cost: Math.max(0, Math.round(v.cost ?? 0)), at };
};

// Báo số tiền thu hộ để nhập khi tạo đơn trên app đơn vị vận chuyển
function CodAlert({ cod }: { cod: number }) {
  return (
    <Alert
      type={cod ? "warning" : "info"}
      showIcon
      style={{ marginBottom: 16 }}
      title={cod ? `Thu hộ (COD) ${formatMoney(cod)}` : "Không thu hộ"}
      description={cod ? "Nhập đúng số tiền này khi tạo đơn trên app đơn vị vận chuyển." : "Khách đã trả đủ, tạo đơn vận chuyển không thu tiền."}
    />
  );
}

// Gửi lại đơn đã hoàn về: phí gửi lại, chọn lại đơn vị (mặc định đơn vị lần trước) và nhập mã vận đơn mới → Đang giao
export function ResendModal({
  open,
  order,
  orders,
  carriers,
  fee,
  onClose,
  onConfirm,
}: Base & { orders: Order[]; carriers: Carrier[]; fee: number; onConfirm: (fee: number, shipment: Shipment) => void }) {
  const [form] = Form.useForm<ShipValues & { fee: number }>();
  const feeNow = Form.useWatch("fee", form);
  const last = order.shipment;
  const list = carriers.filter((c) => c.enabled);
  return (
    <Modal open={open} title={`Gửi lại đơn ${order.code}?`} okText="Gửi lại đơn" cancelText="Quay lại" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      {order.returnCondition === "damaged" && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} title="Nến đã ghi nhận hỏng" description="Kiểm tra lại hoặc thay nến trước khi gửi." />
      )}
      <CodAlert cod={codAmount(order) + Math.max(0, Math.round(Number(feeNow ?? fee) || 0))} />
      <Form
        form={form}
        layout="vertical"
        initialValues={{ fee, cost: fee, carrierId: list.some((c) => c.id === last?.carrierId) ? last?.carrierId : list[0]?.id }}
        onFinish={(v) => onConfirm(Math.round(v.fee), toShipment(list, v))}
      >
        <Form.Item name="fee" label="Phí gửi lại khách trả" extra="Cộng vào tổng đơn, thu khi khách nhận hàng. Không thu thì để 0." rules={[{ required: true, type: "number", min: 0, message: "Nhập phí gửi lại." }]}>
          <MoneyInput />
        </Form.Item>
        {last && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Lần giao trước: {shipmentText(last)}. Có thể chọn đơn vị khác.
          </Typography.Paragraph>
        )}
        <ShipFields form={form} order={order} orders={orders} list={list} previous={last?.trackingCode} />
      </Form>
    </Modal>
  );
}

// Giao cho vận chuyển: chọn đơn vị, nhập mã vận đơn. Sửa lại được khi đơn đang giao (editing)
export function ShipModal({
  open,
  order,
  orders,
  carriers,
  onClose,
  onConfirm,
}: Base & { orders: Order[]; carriers: Carrier[]; onConfirm: (shipment: Shipment) => void }) {
  const [form] = Form.useForm<ShipValues>();
  const current = order.shipment;
  const editing = !!current;
  // Đơn vị đang dùng; đơn vị của đơn đã tắt ở Cài đặt vẫn giữ để sửa mã
  const list = carriers.filter((c) => c.enabled || c.id === current?.carrierId);
  return (
    <Modal
      open={open}
      title={editing ? `Sửa vận chuyển đơn ${order.code}` : `Giao đơn ${order.code} cho vận chuyển`}
      okText={editing ? "Lưu" : "Giao cho vận chuyển"}
      cancelText="Quay lại"
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <CodAlert cod={codAmount(order)} />
      <Form
        form={form}
        layout="vertical"
        initialValues={{ carrierId: current?.carrierId ?? list[0]?.id, trackingCode: current?.trackingCode, cost: current ? (current.cost ?? 0) : order.shippingFee - (order.resendFee ?? 0) }}
        onFinish={(v) => onConfirm(toShipment(list, v, current?.at))}>
        <ShipFields form={form} order={order} orders={orders} list={list} />
      </Form>
    </Modal>
  );
}
