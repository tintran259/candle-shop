import dayjs from "dayjs";
import { slugify } from "@/lib/craft/groups";
import { paymentState, type PaymentState } from "@/lib/orders/labels";
import type { Order, OrderStatus } from "@/lib/orders/types";

export type OrderFilters = {
  q: string;
  status: OrderStatus | "all";
  payment?: PaymentState;
  // Khoảng ngày đặt (YYYY-MM-DD), đủ cả hai đầu
  range?: [string, string];
  sort: "newest" | "ready-soon" | "total-desc";
};

export const defaultOrderFilters: OrderFilters = { q: "", status: "all", sort: "newest" };

const digits = (s: string) => s.replace(/\D/g, "");

// Tìm theo mã đơn, tên khách (không dấu) hoặc số điện thoại
export function applyOrderFilters(list: Order[], f: OrderFilters) {
  const q = slugify(f.q);
  const qDigits = digits(f.q);
  return list
    .filter((o) => f.status === "all" || o.status === f.status)
    .filter((o) => !f.payment || paymentState(o) === f.payment)
    .filter((o) => {
      if (!f.range) return true;
      const d = dayjs(o.createdAt).format("YYYY-MM-DD");
      return d >= f.range[0] && d <= f.range[1];
    })
    .filter(
      (o) =>
        !q ||
        slugify(o.code).includes(q) ||
        slugify(o.customer.name).includes(q) ||
        (qDigits.length >= 3 && digits(o.customer.phone).includes(qDigits)),
    )
    .sort((a, b) => {
      if (f.sort === "ready-soon") return a.readyDate.localeCompare(b.readyDate);
      if (f.sort === "total-desc") return b.total - a.total;
      return b.createdAt.localeCompare(a.createdAt);
    });
}
