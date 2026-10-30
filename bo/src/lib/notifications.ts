// Thông báo trên header — chưa có API nên tự suy ra từ dữ liệu đơn hàng, nguyên liệu, mã giảm giá.
// Khi có BE: thay bằng GET /api/notifications (+ websocket/SSE cho đơn mới), trạng thái đã đọc lưu theo tài khoản.
import dayjs from "dayjs";
import { stockLevel } from "@/lib/craft/groups";
import { optionRows } from "@/lib/craft/steps";
import type { CraftConfig, StepOption } from "@/lib/craft/types";
import { discountStatus, periodHint } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { formatMoney } from "@/lib/format";
import { deadline, remaining } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";

export type NotificationKind = "order-late" | "order-due" | "order-new" | "order-paid" | "stock-out" | "stock-low" | "discount";
// danger/warning = cần xử lý; info = hoạt động mới
export type NotificationTone = "danger" | "warning" | "info";

export type AppNotification = {
  // Ổn định theo nội dung: nội dung đổi (vd thêm nguyên liệu hết hàng) thì thành thông báo mới, chưa đọc
  id: string;
  kind: NotificationKind;
  tone: NotificationTone;
  title: string;
  description: string;
  // Thời điểm sự kiện (ISO) — chỉ có ở hoạt động mới; nhắc việc theo tình trạng hiện tại (trễ hạn, tồn kho) thì không
  at?: string;
  to: string;
};

const lastEventAt = (o: Order, status: Order["status"]) =>
  [...o.history].reverse().find((e) => e.status === status && (e.kind ?? "status") === "status")?.at ?? o.updatedAt;

const names = (items: StepOption[]) => {
  const list = items.map((i) => i.name.vi);
  return list.length > 3 ? `${list.slice(0, 3).join(", ")} và ${list.length - 3} mục khác` : list.join(", ");
};

export function buildNotifications(src: { orders: Order[]; craft: CraftConfig; discounts: Discount[] }, today = dayjs()) {
  const list: AppNotification[] = [];

  for (const o of src.orders) {
    const d = deadline(o, today);
    if (d?.tone === "danger") {
      list.push({
        id: `order-late:${o.id}:${o.readyDate}`,
        kind: "order-late",
        tone: "danger",
        title: `Đơn ${o.code} trễ hạn làm xong`,
        description: `${d.label} — khách ${o.customer.name} hẹn ${dayjs(o.readyDate).format("DD/MM")}.`,
        to: `/orders?order=${o.id}`,
      });
    } else if (d?.tone === "warning" && o.status !== "pending") {
      list.push({
        id: `order-due:${o.id}:${o.readyDate}`,
        kind: "order-due",
        tone: "warning",
        title: `Đơn ${o.code} cần làm xong ${d.label.toLowerCase()}`,
        description: `${o.customer.name} · ${o.items.length} sản phẩm.`,
        to: `/orders?order=${o.id}`,
      });
    }

    if (o.status === "pending") {
      list.push({
        id: `order-new:${o.id}`,
        kind: "order-new",
        tone: "info",
        title: `Đơn mới ${o.code}`,
        description: `${o.customer.name} đặt ${formatMoney(o.total)} — đang chờ thanh toán.`,
        at: o.createdAt,
        to: `/orders?order=${o.id}`,
      });
    } else if (o.status === "paid") {
      const left = remaining(o);
      list.push({
        id: `order-paid:${o.id}`,
        kind: "order-paid",
        tone: "info",
        title: `Đơn ${o.code} đã ${left ? "nhận cọc" : "thanh toán"}`,
        description: left ? `Còn phải thu ${formatMoney(left)} — chờ xưởng nhận làm.` : "Chờ xưởng nhận làm.",
        at: lastEventAt(o, "paid"),
        to: `/orders?order=${o.id}`,
      });
    }
  }

  // Tồn kho: gộp một thông báo cho mỗi mức để không tràn danh sách
  // Chỉ xét bước đang hiện trên web và lựa chọn đang bán
  const materials = optionRows(src.craft)
    .filter(({ step, option }) => step.enabled && option.available)
    .map(({ step, option }) => ({ ...option, id: `${step.id}/${option.id}` }));
  const out = materials.filter((m) => stockLevel(m) === "out");
  const low = materials.filter((m) => stockLevel(m) === "low");
  const ids = (items: StepOption[]) => items.map((i) => i.id).sort().join(",");
  if (out.length)
    list.push({
      id: `stock-out:${ids(out)}`,
      kind: "stock-out",
      tone: "danger",
      title: `${out.length} nguyên liệu đã hết hàng`,
      description: `${names(out)} — khách không chọn được trên trang Thủ công.`,
      to: "/craft",
    });
  if (low.length)
    list.push({
      id: `stock-low:${ids(low)}`,
      kind: "stock-low",
      tone: "warning",
      title: `${low.length} nguyên liệu sắp hết`,
      description: `${names(low)} — nên nhập thêm.`,
      to: "/craft",
    });

  for (const d of src.discounts) {
    const hint = periodHint(d, today);
    if (hint?.urgent)
      list.push({
        id: `discount-ending:${d.id}:${d.endsAt}`,
        kind: "discount",
        tone: "warning",
        title: `Mã ${d.code} sắp hết hạn`,
        description: `${hint.text} · đã dùng ${d.used}${d.usageLimit ? `/${d.usageLimit}` : ""} lượt.`,
        to: `/discounts?edit=${d.id}`,
      });
    else if (discountStatus(d, today) === "exhausted")
      list.push({
        id: `discount-exhausted:${d.id}:${d.usageLimit}`,
        kind: "discount",
        tone: "info",
        title: `Mã ${d.code} đã hết lượt dùng`,
        description: `Đã dùng ${d.used}/${d.usageLimit} lượt — tăng giới hạn nếu muốn chạy tiếp.`,
        to: `/discounts?edit=${d.id}`,
      });
  }

  const rank: Record<NotificationTone, number> = { danger: 0, warning: 1, info: 2 };
  return list.sort((a, b) => rank[a.tone] - rank[b.tone] || (b.at ?? "").localeCompare(a.at ?? ""));
}
