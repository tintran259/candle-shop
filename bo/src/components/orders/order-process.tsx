import { ArrowRightOutlined, CloseCircleOutlined, EditOutlined, InboxOutlined, MessageOutlined, RollbackOutlined, SendOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, App, Button, Divider, Flex, Steps, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router";
import { ComplaintModal } from "@/components/orders/order-complaint";
import { DeliveryFailModal, ReceiveBackModal, ResendModal, ShipModal } from "@/components/orders/order-delivery";
import { consumeOrder } from "@/hooks/use-inventory";
import type { OrdersApi } from "@/hooks/use-orders";
import { useSettings } from "@/hooks/use-settings";
import { useStockHold } from "@/hooks/use-stock-hold";
import { unitLabel } from "@/lib/craft/groups";
import { formatMoney, formatNumber } from "@/lib/format";
import { needsCost } from "@/lib/costs";
import { orderEditable } from "@/lib/orders/edit";
import { orderNeeds, shortages } from "@/lib/orders/materials";
import { cancelOutcomeLabels, canCancel, deadline, isDeliveryIssue, nextAction, nextStatus, remaining, returnConditionLabels, shippingDays, statusMeta, stepLabels } from "@/lib/orders/labels";
import { orderFlow, type Order } from "@/lib/orders/types";
import { radius } from "@/theme";

// Màu chấm trạng thái (khớp màu tag antd)
const dot: Record<Order["status"], string> = {
  pending: "#faad14",
  paid: "#1677ff",
  producing: "#fa8c16",
  ready: "#13c2c2",
  shipping: "#722ed1",
  completed: "#52c41a",
  delivery_failed: "#f5222d",
  returning: "#fa541c",
  returned: "#eb2f96",
  cancelled: "#bfbfbf",
};

// Mốc thời gian dưới mỗi bước: đã qua thì giờ thực tế, chưa tới thì ngày dự kiến
function stepTime(order: Order, step: (typeof orderFlow)[number]) {
  const reached = order.history.find((e) => e.status === step);
  if (reached) return dayjs(reached.at).format("HH:mm DD/MM");
  const ready = dayjs(order.readyDate);
  if (step === "ready") return `Dự kiến ${ready.format("DD/MM")}`;
  if (step === "completed") return `Dự kiến ${ready.add(shippingDays(order), "day").format("DD/MM")}`;
  return undefined;
}

type Props = { order: Order; api: OrdersApi; onCancel: () => void; onEdit?: () => void };

// Thẻ tiến trình đầu drawer: trạng thái hiện tại + hạn + nút bước tiếp theo, rồi thanh 6 bước có mốc thời gian
export function OrderProcess({ order, api, onCancel, onEdit }: Props) {
  const { message, modal } = App.useApp();
  const { settings } = useSettings();
  const { map, available, source } = useStockHold();
  const [dialog, setDialog] = useState<"fail" | "back" | "resend" | "complaint" | "ship" | null>(null);
  const meta = statusMeta[order.status];
  const to = nextStatus(order.status);
  const action = nextAction[order.status];
  const due = deadline(order);
  const left = remaining(order);
  const issue = isDeliveryIssue(order.status);
  const current = orderFlow.indexOf(issue ? "shipping" : (order.status as (typeof orderFlow)[number]));
  const shortList = (items: ReturnType<typeof shortages>) => (
    <ul style={{ margin: 0, paddingInlineStart: 20 }}>
      {items.map(({ m, need }) => (
        <li key={m.id}>
          {m.name}: cần {formatNumber(need)}, còn {formatNumber(m.stock)} {unitLabel[m.unit]}
        </li>
      ))}
    </ul>
  );

  // extra: trường ghi kèm khi chuyển bước, vd giá vốn chốt lúc Bắt đầu làm
  const proceed = (extra?: Partial<Order>) => {
    api.advance(order.id, extra);
    message.success(`Đơn ${order.code}: ${statusMeta[to!].label}`);
  };

  const goNext = () => {
    if (!to) return;
    const needs = orderNeeds(order, source);
    if (to === "paid") {
      // Tiền đã về thì vẫn cho xác nhận, nhưng báo trước đơn này không giữ đủ nguyên liệu
      const short = shortages(needs, available);
      if (short.length)
        return modal.confirm({
          title: "Không đủ nguyên liệu để giữ cho đơn này",
          content: shortList(short),
          okText: "Vẫn xác nhận",
          cancelText: "Quay lại",
          onOk: () => proceed(),
        });
    }
    if (to === "producing") {
      const short = shortages(needs, map);
      if (short.length) return modal.warning({ title: "Kho không đủ để bắt đầu làm", content: shortList(short), okText: "Đã hiểu" });
      consumeOrder(order.code, needs);
      // Chốt giá vốn theo giá nhập lúc trừ Kho
      return proceed({ materialCost: needsCost(needs, map).cost });
    }
    // Giao cho vận chuyển: chọn đơn vị và nhập mã vận đơn
    if (to === "shipping") return setDialog("ship");
    if (to === "completed" && left > 0)
      return modal.confirm({
        title: "Khách đã nhận và đã thu đủ tiền?",
        content: `Hệ thống sẽ ghi nhận đã thu ${formatMoney(left)} còn lại.`,
        okText: "Đã thu đủ, hoàn tất",
        cancelText: "Quay lại",
        onOk: () => proceed(),
      });
    proceed();
  };

  const close = () => setDialog(null);

  return (
    <section aria-label="Tiến trình đơn" style={{ background: "#fff", borderRadius: radius.card, padding: 24 }}>
      <Flex justify="space-between" align="flex-start" gap={16} wrap>
        <Flex vertical gap={6} style={{ minWidth: 0, flex: "1 1 320px" }}>
          <Flex align="center" gap={10}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: dot[order.status], flexShrink: 0 }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              {meta.label}
            </Typography.Title>
          </Flex>
          <Typography.Text type="secondary">{meta.hint}</Typography.Text>
          <Flex gap={8} align="center" wrap style={{ marginTop: 4 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Đặt {dayjs(order.createdAt).format("HH:mm DD/MM")}
            </Typography.Text>
            <span aria-hidden style={{ color: "#d9d9d9" }}>
              •
            </span>
            <Typography.Text style={{ fontSize: 13 }}>Làm xong {dayjs(order.readyDate).format("DD/MM")}</Typography.Text>
            {due && due.tone !== "secondary" && (
              <Tag color={due.tone === "danger" ? "error" : "warning"} style={{ marginInlineEnd: 0 }}>
                {due.label}
              </Tag>
            )}
            {left > 0 && order.status !== "cancelled" && (
              <>
                <span aria-hidden style={{ color: "#d9d9d9" }}>
                  •
                </span>
                <Typography.Text style={{ fontSize: 13 }}>
                  Còn thu <strong className="tabular">{formatMoney(left)}</strong>
                </Typography.Text>
              </>
            )}
          </Flex>
        </Flex>

        {(action || issue || canCancel(order.status) || onEdit) && (
          <Flex gap={8} align="center" wrap>
            {onEdit && orderEditable(order.status) && (
              <Button icon={<EditOutlined />} onClick={onEdit}>
                Sửa đơn
              </Button>
            )}
            {order.status === "completed" && (
              <Button icon={<MessageOutlined />} onClick={() => setDialog("complaint")}>
                Khiếu nại
              </Button>
            )}
            {order.status === "shipping" && (
              <Button icon={<WarningOutlined />} onClick={() => setDialog("fail")}>
                Giao không thành
              </Button>
            )}
            {order.status === "delivery_failed" && (
              <>
                <Button icon={<RollbackOutlined />} onClick={() => { api.startReturn(order.id); message.success(`Đơn ${order.code}: ${statusMeta.returning.label}`); }}>
                  Hoàn về
                </Button>
                <Button type="primary" size="large" icon={<SendOutlined />} onClick={() => { api.redeliver(order.id); message.success(`Đơn ${order.code}: ${statusMeta.shipping.label}`); }}>
                  Giao lại
                </Button>
              </>
            )}
            {order.status === "returning" && (
              <Button type="primary" size="large" icon={<InboxOutlined />} onClick={() => setDialog("back")}>
                Đã nhận lại hàng
              </Button>
            )}
            {canCancel(order.status) && (
              <Button danger icon={<CloseCircleOutlined />} onClick={onCancel}>
                Hủy đơn
              </Button>
            )}
            {to && action && (
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                iconPlacement="end"
                onClick={goNext}
              >
                {action}
              </Button>
            )}
            {order.status === "returned" && (
              <Button type="primary" size="large" icon={<SendOutlined />} onClick={() => setDialog("resend")}>
                Gửi lại đơn
              </Button>
            )}
          </Flex>
        )}
      </Flex>

      {order.replacementFor && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          title={
            <>
              Đơn gửi bù cho khiếu nại của đơn <Link to={`/orders?order=${order.replacementFor.id}`}>{order.replacementFor.code}</Link>
            </>
          }
          description="Giá 0 ₫: không tính vào doanh thu, số đơn, khách hàng; giá vốn vẫn tính vào lãi gộp."
        />
      )}
      {order.status === "delivery_failed" && <Alert type="warning" showIcon style={{ marginTop: 16 }} title={`Giao không thành lần ${order.deliveryAttempts ?? 1}/${settings.maxDeliveryAttempts}`} description={order.deliveryIssue} />}
      {order.status === "returned" && order.returnCondition && (
        <Alert type={order.returnCondition === "good" ? "info" : "warning"} showIcon style={{ marginTop: 16 }} title={returnConditionLabels[order.returnCondition]} description={order.returnNote} />
      )}

      <Divider style={{ margin: "20px 0" }} />

      {order.status === "cancelled" ? (
        <Alert
          type="error"
          showIcon
          title="Đơn đã hủy"
          description={
            <>
              {order.cancelReason}
              {order.cancelOutcome && (
                <div>
                  {order.cancelOutcome === "stocked" ? <Link to="/cancelled-products">{cancelOutcomeLabels.stocked}</Link> : cancelOutcomeLabels.returned}
                </div>
              )}
            </>
          }
        />
      ) : (
        <Steps
          size="small"
          current={current}
          status={issue ? "error" : current === orderFlow.length - 1 ? "finish" : "process"}
          titlePlacement="vertical"
          responsive
          items={orderFlow.map((s) => ({ title: stepLabels[s], content: stepTime(order, s) }))}
        />
      )}

      <DeliveryFailModal
        open={dialog === "fail"}
        order={order}
        max={settings.maxDeliveryAttempts}
        onClose={close}
        onConfirm={(reason) => {
          api.failDelivery(order.id, reason, settings.maxDeliveryAttempts);
          close();
          message.warning(`Đã ghi nhận giao không thành đơn ${order.code}`);
        }}
      />
      <ReceiveBackModal
        open={dialog === "back"}
        order={order}
        onClose={close}
        onConfirm={(condition, note, returnFee) => {
          api.receiveReturn(order.id, condition, note, returnFee);
          close();
          message.success(`Đơn ${order.code}: ${statusMeta.returned.label}`);
        }}
      />
      {dialog === "complaint" && <ComplaintModal open order={order} api={api} onClose={close} />}
      <ShipModal
        open={dialog === "ship"}
        order={order}
        orders={api.orders}
        carriers={settings.carriers}
        onClose={close}
        onConfirm={(shipment) => {
          api.ship(order.id, shipment);
          close();
          message.success(`Đơn ${order.code}: ${statusMeta.shipping.label}`);
        }}
      />
      <ResendModal
        open={dialog === "resend"}
        order={order}
        orders={api.orders}
        carriers={settings.carriers}
        fee={settings.resendFee}
        onClose={close}
        onConfirm={(fee, shipment) => {
          api.resend(order.id, fee, shipment);
          close();
          message.success(`Đã gửi lại đơn ${order.code} qua ${shipment.carrier}`);
        }}
      />
    </section>
  );
}
