// ⚠️ DỮ LIỆU MẪU — hồ sơ lấy từ khách trong đơn mẫu (gộp theo số điện thoại) + vài tài khoản chưa đặt đơn.
// Bản thật lấy từ BE: GET /api/customers.
import dayjs from "dayjs";
import { phoneKey } from "@/lib/customers/stats";
import type { Customer } from "@/lib/customers/types";
import { mockOrders } from "@/lib/orders/mock";

// Thông tin shop tự ghi cho một số khách (theo số điện thoại)
const extras: Record<string, Partial<Customer>> = {
  "0944889900": { tags: ["Khách sỉ", "Doanh nghiệp"], note: "Mua quà tặng cho công ty Lumière — cần xuất hoá đơn VAT.", newsletter: true },
  "0977001122": { tags: ["Mua quà tặng"], note: "Thích gói quà màu kem, ghi thiệp tiếng Anh.", newsletter: true },
  "0987654321": { tags: ["Hay tự phối"], newsletter: true },
  "0905778899": { tags: ["Ưu tiên giao nhanh"] },
  "0973787909": { blocked: true, blockReason: "Bom hàng: không nhận hàng, không nghe máy (đơn 20 ngày trước)." },
};
// Khách đặt không đăng nhập
const guests = new Set(["0966334455", "0911990011", "0973787909", "0936778112"]);

const fromOrders = new Map<string, Customer>();
for (const o of [...mockOrders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
  const key = phoneKey(o.customer.phone);
  if (fromOrders.has(key)) continue;
  const hasAccount = !guests.has(key);
  fromOrders.set(key, {
    id: `cus-${key.slice(-6)}`,
    name: o.customer.name,
    email: o.customer.email,
    phone: o.customer.phone,
    hasAccount,
    newsletter: false,
    tags: [],
    blocked: false,
    // Có tài khoản: đăng ký trước đơn đầu vài ngày; vãng lai: hồ sơ tạo lúc đặt đơn đầu
    createdAt: dayjs(o.createdAt).subtract(hasAccount ? (key.charCodeAt(9) % 20) + 1 : 0, "day").toISOString(),
    ...extras[key],
  });
}

const accountsOnly: Customer[] = [
  { name: "Phan Mỹ Duyên", phone: "0901 456 789", days: 4, newsletter: true },
  { name: "Tạ Quang Minh", phone: "0938 212 454", days: 13, newsletter: false },
  { name: "Lâm Bích Ngọc", phone: "0912 676 898", days: 31, newsletter: true },
].map(({ name, phone, days, newsletter }) => ({
  id: `cus-${phoneKey(phone).slice(-6)}`,
  name,
  email: `${name.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().split(" ").slice(-2).join("")}@example.com`,
  phone,
  hasAccount: true,
  newsletter,
  tags: [],
  blocked: false,
  createdAt: dayjs().subtract(days, "day").hour(20).minute(15).toISOString(),
}));

export const mockCustomers: Customer[] = [...fromOrders.values(), ...accountsOnly];

// Gợi ý nhãn hay dùng trong ô chọn nhãn
export const tagSuggestions = ["Mua quà tặng", "Khách sỉ", "Doanh nghiệp", "Hay tự phối", "Ưu tiên giao nhanh", "Hay đổi lịch"];
