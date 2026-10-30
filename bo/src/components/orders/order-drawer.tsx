import { Alert, App, Button, Col, Drawer, Flex, Form, Grid, Input, Modal, Result, Row, Typography } from "antd";
import { useDeferredValue, useState } from "react";
import { OrderProcess } from "@/components/orders/order-process";
import { CustomerSection } from "@/components/orders/order-customer";
import { PaymentSection } from "@/components/orders/order-payment";
import { HistorySection } from "@/components/orders/order-history";
import { ItemsSection, NotesSection } from "@/components/orders/order-sections";
import { OrderDetailSkeleton } from "@/components/skeletons";
import type { OrdersApi } from "@/hooks/use-orders";
import type { Order } from "@/lib/orders/types";

// open: có id đơn trên URL. Đang tải → khung xương; tải xong mà không có đơn → báo không tìm thấy
type Props = { open: boolean; order?: Order; api: OrdersApi; onClose: () => void };

// Chi tiết đơn. Màn rộng chia 2 cột: trái là nội dung đơn (sản phẩm, lịch sử),
// phải là thông tin tra cứu nhanh (thanh toán, khách, ghi chú). Thao tác nằm ở thẻ tiến trình trên cùng.
export function OrderDrawer({ open, order, api, onClose }: Props) {
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
      styles={{ header: { background: "#fff" }, body: { padding: screens.md ? 24 : 16 } }}
    >
      {(api.loading || (order && !ready)) && <OrderDetailSkeleton />}
      {!api.loading && !order && (
        <Result
          status="404"
          title="Không tìm thấy đơn hàng"
          subTitle="Đơn có thể đã bị xóa hoặc đường dẫn không đúng."
          extra={<Button onClick={onClose}>Về danh sách đơn</Button>}
        />
      )}
      {!api.loading && order && ready && (
        <Flex vertical gap={16}>
          <OrderProcess order={order} api={api} onCancel={() => setCancelOpen(true)} />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={15}>
              <Flex vertical gap={16}>
                <ItemsSection order={order} />
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
          onConfirm={(reason) => {
            api.cancel(order.id, reason);
            setCancelOpen(false);
            message.success(`Đã hủy đơn ${order.code}`);
          }}
        />
      )}
    </Drawer>
  );
}

function CancelModal({ open, order, onClose, onConfirm }: { open: boolean; order: Order; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [form] = Form.useForm<{ reason: string }>();
  const paid = order.payments.some((p) => p.status === "success");
  return (
    <Modal
      open={open}
      title={`Hủy đơn ${order.code}?`}
      okText="Hủy đơn"
      okButtonProps={{ danger: true }}
      cancelText="Quay lại"
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      {paid && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title="Khách đã thanh toán"
          description="Nhớ hoàn tiền cho khách qua cổng thanh toán — hệ thống chưa tự hoàn."
        />
      )}
      <Form form={form} layout="vertical" onFinish={(v) => onConfirm(v.reason.trim())}>
        <Form.Item name="reason" label="Lý do hủy" rules={[{ required: true, whitespace: true, message: "Nhập lý do hủy." }]} style={{ marginBottom: 0 }}>
          <Input.TextArea autoFocus autoSize={{ minRows: 2, maxRows: 4 }} placeholder="VD: Khách đổi ý, hết nguyên liệu…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
