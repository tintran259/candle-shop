// Công suất xưởng: số cây đã nhận cho mỗi ngày làm xong, gợi ý ngày còn chỗ (docs/pages/settings.md#công-suất-xưởng)
import dayjs, { type Dayjs } from "dayjs";
import type { Order, OrderStatus } from "@/lib/orders/types";

const DAY = "YYYY-MM-DD";
// Đơn còn chiếm chỗ của xưởng: chưa làm xong
const ACTIVE: OrderStatus[] = ["pending", "paid", "producing"];

export const candleCount = (lines: { quantity?: number }[]) => lines.reduce((s, l) => s + Math.max(0, Math.round(l.quantity ?? 0)), 0);

// Ngày làm xong → số cây. excludeId: đơn đang sửa, không tự tính chỗ của chính nó
export function productionLoad(orders: Order[], excludeId?: string) {
  const load = new Map<string, number>();
  for (const o of orders) {
    if (!ACTIVE.includes(o.status) || o.id === excludeId) continue;
    load.set(o.readyDate, (load.get(o.readyDate) ?? 0) + candleCount(o.items));
  }
  return load;
}

export type DayLoad = { date: string; load: number; capacity: number; free: number; over: boolean };

// capacity 0 = không giới hạn
export function dayLoad(load: Map<string, number>, date: string, capacity: number, adding = 0): DayLoad {
  const total = (load.get(date) ?? 0) + adding;
  return { date, load: total, capacity, free: capacity ? Math.max(0, capacity - total) : Infinity, over: !!capacity && total > capacity };
}

// Ngày làm xong sớm nhất từ hôm nay + số ngày làm tối thiểu còn đủ chỗ cho đơn. Đơn lớn hơn công suất một ngày thì lấy ngày còn trống hẳn
export function suggestReadyDate(load: Map<string, number>, candles: number, { capacity, leadDays }: { capacity: number; leadDays: number }, today: Dayjs = dayjs()) {
  const start = today.startOf("day").add(leadDays, "day");
  if (!capacity) return start.format(DAY);
  for (let i = 0; i < 120; i++) {
    const date = start.add(i, "day").format(DAY);
    const used = load.get(date) ?? 0;
    if (used + candles <= capacity || (candles > capacity && used === 0)) return date;
  }
  return start.format(DAY);
}

// Lịch xưởng các ngày tới cho Dashboard
export const workshopSchedule = (orders: Order[], capacity: number, days = 7, today: Dayjs = dayjs()) => {
  const load = productionLoad(orders);
  return Array.from({ length: days }, (_, i) => dayLoad(load, today.startOf("day").add(i, "day").format(DAY), capacity));
};
