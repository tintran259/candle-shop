import dayjs from "dayjs";
import type { Discount, DiscountScope, DiscountType } from "@/lib/discounts/types";
import { formatMoney } from "@/lib/format";

export const typeLabels: Record<DiscountType, string> = { percent: "Giảm theo %", fixed: "Giảm số tiền", freeship: "Miễn phí giao hàng" };
export const scopeLabels: Record<DiscountScope, string> = { all: "Mọi sản phẩm", products: "Chỉ nến có sẵn", custom: "Chỉ nến tự phối" };

export type DiscountStatus = "running" | "scheduled" | "expired" | "exhausted" | "paused";

// Trạng thái tự tính theo ngày + lượt dùng; tạm dừng thủ công ưu tiên trước
export function discountStatus(d: Discount, today = dayjs()): DiscountStatus {
  if (!d.active) return "paused";
  const day = today.format("YYYY-MM-DD");
  if (d.endsAt && d.endsAt < day) return "expired";
  if (d.usageLimit !== undefined && d.used >= d.usageLimit) return "exhausted";
  if (d.startsAt > day) return "scheduled";
  return "running";
}

// Màu luôn đi kèm chữ
export const statusMeta: Record<DiscountStatus, { label: string; color: string }> = {
  running: { label: "Đang chạy", color: "green" },
  scheduled: { label: "Lên lịch", color: "blue" },
  expired: { label: "Hết hạn", color: "default" },
  exhausted: { label: "Hết lượt", color: "orange" },
  paused: { label: "Tạm dừng", color: "default" },
};

// "−15%", "−50.000 ₫", "Miễn phí ship"
export function valueText(d: Pick<Discount, "type" | "value">) {
  if (d.type === "percent") return `−${d.value}%`;
  if (d.type === "fixed") return `−${formatMoney(d.value)}`;
  return "Miễn phí ship";
}

// Tóm tắt điều kiện bằng câu ngắn để đọc nhanh trên bảng và phiếu xem trước
export function conditionText(d: Pick<Discount, "type" | "maxDiscount" | "minOrder" | "scope" | "firstOrderOnly">) {
  const parts: string[] = [];
  if (d.type === "percent" && d.maxDiscount) parts.push(`tối đa ${formatMoney(d.maxDiscount)}`);
  parts.push(d.minOrder ? `đơn từ ${formatMoney(d.minOrder)}` : "mọi giá trị đơn");
  if (d.scope !== "all") parts.push(scopeLabels[d.scope].toLowerCase());
  if (d.firstOrderOnly) parts.push("khách đặt lần đầu");
  return parts.join(" · ");
}

export function periodText(d: Pick<Discount, "startsAt" | "endsAt">) {
  const from = dayjs(d.startsAt).format("DD/MM/YYYY");
  return d.endsAt ? `${from} – ${dayjs(d.endsAt).format("DD/MM/YYYY")}` : `Từ ${from} · không hết hạn`;
}

// Nhắc hạn: "Còn 3 ngày", "Bắt đầu sau 5 ngày"
export function periodHint(d: Discount, today = dayjs()): { text: string; urgent: boolean } | null {
  const s = discountStatus(d, today);
  if (s === "scheduled") return { text: `Bắt đầu sau ${dayjs(d.startsAt).diff(today.startOf("day"), "day")} ngày`, urgent: false };
  if (s !== "running" || !d.endsAt) return null;
  const left = dayjs(d.endsAt).diff(today.startOf("day"), "day");
  return { text: left === 0 ? "Hết hạn hôm nay" : `Còn ${left} ngày`, urgent: left <= 7 };
}

// Mã ngẫu nhiên dễ đọc (bỏ 0/O, 1/I)
export function randomCode(prefix = "2510") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return prefix + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export const normalizeCode = (s = "") =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
