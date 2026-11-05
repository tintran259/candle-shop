import dayjs from "dayjs";
import { shippingDays } from "@/lib/orders/labels";
import { orderFlow, type Order } from "@/lib/orders/types";

// Màu chấm trạng thái (khớp màu tag antd)
export const dot: Record<Order["status"], string> = {
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
export function stepTime(order: Order, step: (typeof orderFlow)[number]) {
  const reached = order.history.find((e) => e.status === step);
  if (reached) return dayjs(reached.at).format("HH:mm DD/MM");
  const ready = dayjs(order.readyDate);
  if (step === "ready") return `Dự kiến ${ready.format("DD/MM")}`;
  if (step === "completed") return `Dự kiến ${ready.add(shippingDays(order), "day").format("DD/MM")}`;
  return undefined;
}
