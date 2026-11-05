import { Alert, App, Button, Col, Drawer, Flex, Form, Grid, Input, Modal, Radio, Result, Row, Typography } from "antd";
import { useDeferredValue, useState } from "react";
import { PrintMenu } from "@/components/orders/order-print";
import { OrderProcess } from "@/components/orders/order-process";
import { CustomerSection } from "@/components/orders/order-customer";
import { PaymentSection } from "@/components/orders/order-payment";
import { HistorySection } from "@/components/orders/order-history";
import { ComplaintsSection, ItemsSection, NotesSection } from "@/components/orders/order-sections";
import { OrderDetailSkeleton } from "@/components/skeletons";
import type { CancelInput, OrdersApi } from "@/hooks/use-orders";
import { addFromOrder } from "@/hooks/use-cancelled-products";
import { releaseDiscount } from "@/hooks/use-discounts";
import { restoreOrder, useInventory } from "@/hooks/use-inventory";
import { hasCustomItems } from "@/lib/cancelled/labels";
import { formatMoney } from "@/lib/format";
import { faultLabels, paidAmount, refundFor } from "@/lib/orders/labels";
import type { CancelFault, CancelOutcome, Order } from "@/lib/orders/types";

// open: có id đơn trên URL. Đang tải → khung xương; tải xong mà không có đơn → báo không tìm thấy
type Props = { open: boolean; order?: Order; api: OrdersApi; onClose: () => void; onEdit?: (id: string) => void };

// Chi tiết đơn. Màn rộng chia 2 cột: trái là nội dung đơn (sản phẩm, lịch sử),
// phải là thông tin tra cứu nhanh (thanh toán, khách, ghi chú). Thao tác nằm ở thẻ tiến trình trên cùng.
export function OrderDrawer({ open, order, api, onClose, onEdit }: Props) {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [cancelOpen, setCancelOpen] = useState(false);
  const width = screens.xl ? 1080 : screens.lg ? 920 : "100%";
  // Mở đơn mới: drawer trượt ra ngay với khung xương, nội dung chi tiết (nặng) render sau ở chế độ
  // ưu tiên thấp — React chia nhỏ việc render nên không chặn hiệu ứng trượt. Mở lại đúng đơn cũ thì hiện ngay.
  const readyId = useDeferredValue(order?.id, undefined);
  const ready = !!order && readyId === order.id;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        !api.loading &&
        order && (
          <Flex align="baseline" gap={8} wrap>
            <Typography.Text strong copyable={{ text: order.code, tooltips: ["Sao chép mã đơn", "Đã sao chép"] }} className="tabular" style={{ fontSize: 16 }}>
              Đơn {order.code}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
              · {order.customer.name}
            </Typography.Text>
          </Flex>
        )
      }
      size={width}
      extra={!api.loading && order && <PrintMenu orders={[order]} />}
      styles={{ header: { background: "#fff" }, body: { padding: screens.md ? 24 : 16 } }}
    >
      {(api.loading || (order && !ready)) && <OrderDetailSkeleton />}
      {!api.loading && !order && (
        <Result status="404" title="Không tìm thấy đơn hàng" subTitle="Đơn có thể đã bị xóa hoặc đường dẫn không đúng." extra={<Button onClick={onClose}>Về danh sách đơn</Button>} />
      )}
      {!api.loading && order && ready && (
        <Flex vertical gap={16}>
          <OrderProcess order={order} api={api} onCancel={() => setCancelOpen(true)} onEdit={onEdit && (() => onEdit(order.id))} />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={15}>
              <Flex vertical gap={16}>
                <ItemsSection order={order} />
                <ComplaintsSection order={order} />
                <HistorySection order={order} />
              </Flex>
            </Col>
            <Col xs={24} lg={9}>
              <Flex vertical gap={16}>
                <PaymentSection order={order} api={api} />
                <CustomerSection order={order} api={api} />
                <NotesSection key={order.id} order={order} api={api} />
              </Flex>
            </Col>
          </Row>
        </Flex>
      )}

      {order && (
        <CancelModal
          open={cancelOpen}
          order={order}
          onClose={() => setCancelOpen(false)}
          onConfirm={(input) => {
            const { reason, outcome } = input;
            const restored = outcome === "returned" ? restoreOrder(order.code) : 0;
            const stocked = outcome === "stocked" ? addFromOrder(order, reason) : 0;
            api.cancel(order.id, input);
            if (order.discountCode) releaseDiscount(order.discountCode);
            setCancelOpen(false);
            if (stocked) message.success(`Đã hủy đơn ${order.code}, ${stocked} sản phẩm thủ công chuyển sang Sản phẩm hủy đơn`);
            else message.success(restored ? `Đã hủy đơn ${order.code}, hoàn ${restored} nguyên liệu về Kho` : `Đã hủy đơn ${order.code}`);
          }}
        />
      )}
    </Drawer>
  );
}

function CancelModal({ open, order, onClose, onConfirm }: { open: boolean; order: Order; onClose: () => void; onConfirm: (input: CancelInput) => void }) {
  const [form] = Form.useForm<{ reason: string; outcome?: CancelOutcome; fault?: CancelFault }>();
  const fault = Form.useWatch("fault", form);
  const { movements } = useInventory();
  const paid = paidAmount(order);
  const refund = fault ? refundFor(order, fault) : 0;
  const crafted = hasCustomItems(order);
  // Nến thủ công đã xong thì tự chuyển, trừ nến hoàn về bị hỏng
  const finished = crafted && (order.status === "ready" || (order.status === "returned" && order.returnCondition === "good"));
  // Đơn toàn nến có sẵn chỉ cần hỏi khi đã trừ Kho theo công thức
  const ask = order.status === "producing" && (crafted || movements.some((m) => m.orderCode === order.code && m.type === "order"));
  return (
    <Modal open={open} title={`Hủy đơn ${order.code}?`} okText="Hủy đơn" okButtonProps={{ danger: true }} cancelText="Quay lại" onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      {finished && <Alert type="info" showIcon style={{ marginBottom: 16 }} title="Nến đã làm xong" description="Nến thủ công sẽ chuyển sang Sản phẩm hủy đơn, nguyên liệu không hoàn về Kho." />}
      {order.status === "returned" && order.returnCondition === "damaged" && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} title="Nến đã ghi nhận hỏng" description="Không tạo sản phẩm hủy đơn, nguyên liệu không hoàn về Kho." />
      )}
      <Form form={form} layout="vertical" onFinish={(v) => onConfirm({ reason: v.reason.trim(), outcome: finished ? "stocked" : v.outcome, fault: v.fault })}>
        {ask && (
          <Form.Item name="outcome" label="Bạn đã thực hiện làm sản phẩm này chưa?" rules={[{ required: true, message: "Chọn đã làm hay chưa để xử lý Kho." }]}>
            <Radio.Group
              vertical
              options={[
                { value: "returned", label: "Chưa làm, hoàn nguyên liệu về Kho" },
                crafted ? { value: "stocked", label: "Đã làm, chuyển sang Sản phẩm hủy đơn" } : { value: "consumed", label: "Đã làm, không hoàn nguyên liệu" },
              ]}
            />
          </Form.Item>
        )}
        {paid > 0 && (
          <Form.Item
            name="fault"
            label={`Khách đã trả ${formatMoney(paid)}. Lỗi do ai?`}
            extra={fault && (refund ? `Cần hoàn ${formatMoney(refund)}, giữ lại ${formatMoney(paid - refund)}.` : "Không hoàn tiền, giữ lại tiền cọc.")}
            rules={[{ required: true, message: "Chọn lỗi do ai để tính tiền hoàn." }]}
          >
            <Radio.Group options={(["customer", "shop"] as const).map((value) => ({ value, label: faultLabels[value] }))} />
          </Form.Item>
        )}
        <Form.Item name="reason" label="Lý do hủy" rules={[{ required: true, whitespace: true, message: "Nhập lý do hủy." }]} style={{ marginBottom: 0 }}>
          <Input.TextArea autoFocus autoSize={{ minRows: 2, maxRows: 4 }} placeholder="VD: Khách đổi ý, hết nguyên liệu…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
