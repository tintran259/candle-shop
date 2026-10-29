// Cấu hình xưởng — sau này lấy từ BO qua API (GET /api/shop-config).
// Chưa có NEXT_PUBLIC_API_URL thì dùng dữ liệu mẫu bên dưới, cùng cấu trúc với API.

import { mockCatalog } from "@/lib/customizer/catalog.mock";
import type { CustomizerCatalog } from "@/lib/customizer/types";

export type Localized = { vi: string; en: string };

export type ShopContact = {
  phone: string;
  zalo: string;
  messenger: string;
  email: string;
  hours: Localized;
};

export type ShopConfig = {
  // Các nhóm tùy chọn của trang Thủ công
  customizer: CustomizerCatalog;
  production: {
    // Thời gian đổ + ủ hương, tính theo ngày làm việc
    leadTimeDays: { min: number; max: number };
    // Số nến xưởng làm được mỗi ngày
    dailyCapacity: number;
    // 0 = Chủ nhật … 6 = Thứ 7
    workingDays: number[];
    // Ngày nghỉ (YYYY-MM-DD)
    holidays: string[];
    // Số nến đã nhận theo ngày hoàn thành (YYYY-MM-DD)
    booked: Record<string, number>;
  };
  payment: {
    depositRate: number;
  };
  contact: ShopContact;
};

// Ngày hoàn thành đã kín một phần — giả lập để thấy ngày hết chỗ (chỉ gọi ở client)
function mockBooked(capacity: number, today: Date) {
  const booked: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const seed = (d.getDate() * 7 + d.getMonth() * 13) % 10;
    booked[toISODate(d)] = seed >= 8 ? capacity : Math.round((seed / 10) * capacity);
  }
  return booked;
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAILY_CAPACITY = 24;

const mockShopConfig: ShopConfig = {
  customizer: mockCatalog,
  production: {
    leadTimeDays: { min: 2, max: 3 },
    dailyCapacity: DAILY_CAPACITY,
    workingDays: [1, 2, 3, 4, 5, 6],
    holidays: [],
    booked: {},
  },
  payment: { depositRate: 0.5 },
  contact: {
    phone: "0901 234 567",
    zalo: "https://zalo.me/0901234567",
    messenger: "https://m.me/2510scentedcandle",
    email: "hello@2510candle.vn",
    hours: { vi: "8:00 – 21:00, Thứ 2 – Thứ 7", en: "8:00 – 21:00, Mon – Sat" },
  },
};

export async function getShopConfig(): Promise<ShopConfig> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    const { production } = mockShopConfig;
    return { ...mockShopConfig, production: { ...production, booked: mockBooked(production.dailyCapacity, new Date()) } };
  }
  const res = await fetch(`${apiUrl}/shop-config`);
  if (!res.ok) throw new Error(`Shop config failed: ${res.status}`);
  return res.json();
}

export const pick = (text: Localized, locale: string) => (locale === "en" ? text.en : text.vi);
