import { ArrowRightOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Alert, App, Button, Divider, Flex, Steps, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { OrdersApi } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import { canCancel, deadline, nextAction, nextStatus, remaining, statusMeta, stepLabels } from "@/lib/orders/labels";
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
  cancelled: "#bfbfbf",
};

const SHIP_DAYS = { standard: 3, express: 1 } as const;

// Mốc thời gian dưới mỗi bước: đã qua thì giờ thực tế, chưa tới thì ngày dự kiến
function stepTime(order: Order, step: (typeof orderFlow)[number]) {
  const reached = order.history.find((e) => e.status === step);
  if (reached) return dayjs(reached.at).format("HH:mm DD/MM");
  const ready = dayjs(order.readyDate);
  if (step === "ready") return `Dự kiến ${ready.format("DD/MM")}`;
  if (step === "completed") return `Dự kiến ${ready.add(SHIP_DAYS[order.shippingMethod], "day").format("DD/MM")}`;
  return undefined;
}

type Props = { order: Order; api: OrdersApi; onCancel: () => void };

// Thẻ tiến trình đầu drawer: trạng thái hiện tại + hạn + nút bước tiếp theo, rồi thanh 6 bước có mốc thời gian
export function OrderProcess({ order, api, onCancel }: Props) {
  const { message } = App.useApp();
  const meta = statusMeta[order.status];
  const to = nextStatus(order.status);
  const action = nextAction[order.status];
  const due = deadline(order);
  const left = remaining(order);
  const current = orderFlow.indexOf(order.status as (typeof orderFlow)[number]);

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

        {(action || canCancel(order.status)) && (
          <Flex gap={8} align="center" wrap>
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
                onClick={() => {
                  api.advance(order.id);
                  message.success(`Đơn ${order.code}: ${statusMeta[to].label}`);
                }}
              >
                {action}
              </Button>
            )}
          </Flex>
        )}
      </Flex>

      <Divider style={{ margin: "20px 0" }} />

      {order.status === "cancelled" ? (
        <Alert type="error" showIcon title="Đơn đã hủy" description={order.cancelReason} />
      ) : (
        <Steps
          size="small"
          current={current}
          status={current === orderFlow.length - 1 ? "finish" : "process"}
          titlePlacement="vertical"
          responsive
          items={orderFlow.map((s) => ({ title: stepLabels[s], content: stepTime(order, s) }))}
        />
      )}
    </section>
  );
}
