import { toISODate, type ShopConfig } from "@/lib/shop-config";

type Production = ShopConfig["production"];

export type ReadyOption = {
  // Ngày xưởng hoàn thành (YYYY-MM-DD)
  date: string;
  remaining: number;
  available: boolean;
};

const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isWorkingDay = (d: Date, p: Production) =>
  p.workingDays.includes(d.getDay()) && !p.holidays.includes(toISODate(d));

export function addWorkingDays(from: Date, days: number, p: Production) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d, p)) added++;
  }
  return d;
}

/**
 * Các ngày hoàn thành có thể chọn: sớm nhất là hôm nay + thời gian làm tối đa,
 * ngày nào còn đủ suất cho `quantity` nến thì chọn được.
 */
export function readyOptions(p: Production, quantity: number, now: Date, count = 10): ReadyOption[] {
  const options: ReadyOption[] = [];
  const d = addWorkingDays(now, p.leadTimeDays.max, p);
  for (let guard = 0; options.length < count && guard < 60; guard++) {
    if (isWorkingDay(d, p)) {
      const date = toISODate(d);
      const remaining = Math.max(p.dailyCapacity - (p.booked[date] ?? 0), 0);
      options.push({ date, remaining, available: remaining >= quantity });
    }
    d.setDate(d.getDate() + 1);
  }
  return options;
}

export const firstAvailable = (options: ReadyOption[]) => options.find((o) => o.available)?.date ?? null;

// Ngày khách nhận = ngày hoàn thành + số ngày giao
export function deliveryDate(readyISO: string, shippingDays: number) {
  const d = parseISO(readyISO);
  d.setDate(d.getDate() + shippingDays);
  return d;
}

export const formatDay = (date: Date | string, locale: string, opts?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    ...opts,
  }).format(typeof date === "string" ? parseISO(date) : date);
