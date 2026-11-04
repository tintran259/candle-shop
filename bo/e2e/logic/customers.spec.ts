// Khách hàng: phân loại tự động, chỉ số, bộ lọc, sắp xếp (docs/pages/customers.md)
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { applyCustomerFilters, defaultCustomerFilters, type CustomerFilters } from "@/lib/customers/filters";
import { AT_RISK_DAYS, customerStats, favoriteItems, groupOrdersByPhone, VIP_ORDERS, VIP_SPENT } from "@/lib/customers/stats";
import type { Customer } from "@/lib/customers/types";
import type { Order } from "@/lib/orders/types";

const today = dayjs("2026-11-03T12:00:00");
const ago = (days: number) => today.subtract(days, "day").toISOString();
const customer = (phone: string, over: Partial<Customer> = {}): Customer => ({
  id: phone,
  name: "Khách " + phone,
  email: "khach@mail.vn",
  phone,
  hasAccount: false,
  newsletter: false,
  tags: [],
  blocked: false,
  createdAt: ago(200),
  ...over,
});
let n = 0;
const order = (phone: string, paid: number, daysAgo: number, over: Partial<Order> = {}) =>
  ({
    id: `o${++n}`,
    status: "completed",
    createdAt: ago(daysAgo),
    customer: { name: "", phone },
    payments: [{ status: "success", amount: paid }],
    history: [],
    items: [{ productId: "p", name: "Nến", quantity: 1, price: paid }],
    shippingAddress: "1 Lê Lợi",
    total: paid,
    ...over,
  }) as unknown as Order;
const stats = (phone: string, orders: Order[]) => customerStats(customer(phone), groupOrdersByPhone(orders), today);

test.describe("Phân loại tự động", () => {
  test("Chưa mua: chưa có đơn hoặc chỉ có đơn đã hủy", () => {
    expect(stats("0901", []).segment).toBe("none");
    expect(stats("0901", [order("0901", 500_000, 3, { status: "cancelled" })]).segment).toBe("none");
  });
  test("Khách mới: 1 đơn; Khách quen: từ 2 đơn", () => {
    expect(stats("0902", [order("0902", 500_000, 3)]).segment).toBe("new");
    expect(stats("0902", [order("0902", 500_000, 3), order("0902", 500_000, 10)]).segment).toBe("returning");
  });
  test(`VIP: đã chi từ ${VIP_SPENT} hoặc từ ${VIP_ORDERS} đơn`, () => {
    expect(stats("0903", [order("0903", VIP_SPENT, 3)]).segment).toBe("vip");
    expect(stats("0903", [order("0903", VIP_SPENT - 1000, 3)]).segment).toBe("new");
    expect(stats("0903", Array.from({ length: VIP_ORDERS }, (_, i) => order("0903", 100_000, i + 1))).segment).toBe("vip");
  });
  test(`Lâu chưa mua: hơn ${AT_RISK_DAYS} ngày không có đơn, VIP vẫn là VIP`, () => {
    expect(stats("0904", [order("0904", 500_000, AT_RISK_DAYS + 1)]).segment).toBe("at-risk");
    expect(stats("0904", [order("0904", 500_000, AT_RISK_DAYS)]).segment).toBe("new");
    expect(stats("0904", [order("0904", VIP_SPENT, AT_RISK_DAYS + 30)]).segment).toBe("vip");
  });
  test("Gộp theo số điện thoại bỏ ký tự thừa", () => {
    expect(customerStats(customer("0905 123 456"), groupOrdersByPhone([order("0905-123-456", 500_000, 1)]), today).orderCount).toBe(1);
  });
});

test.describe("Chỉ số của khách", () => {
  test("Đã chi là tiền thực nhận gồm cọc, không tính đơn hủy và khoản chưa thu", () => {
    const s = stats("0910", [
      order("0910", 300_000, 2, { total: 600_000 }),
      order("0910", 1_000_000, 5, { status: "cancelled" }),
      order("0910", 0, 8, { payments: [{ status: "pending", amount: 400_000 }] as Order["payments"] }),
    ]);
    expect(s).toMatchObject({ orderCount: 2, cancelled: 1, spent: 300_000, average: 150_000 });
  });
  test("Đơn gần nhất, đơn đầu tiên, địa chỉ không trùng", () => {
    const s = stats("0911", [order("0911", 1, 2, { shippingAddress: "A" }), order("0911", 1, 9, { shippingAddress: "B" }), order("0911", 1, 20, { shippingAddress: "A" })]);
    expect(s.lastOrderAt).toBe(ago(2));
    expect(s.firstOrderAt).toBe(ago(20));
    expect(s.addresses).toEqual(["A", "B"]);
  });
  test("Số lần giao không thành đếm theo lịch sử đơn", () => {
    const failed = order("0912", 1, 2, { history: [{ status: "delivery_failed" }, { status: "shipping" }, { status: "delivery_failed" }] as Order["history"] });
    expect(stats("0912", [failed]).failedDeliveries).toBe(2);
  });
  test("Hay mua: theo số lượng, bỏ đơn hủy", () => {
    const item = (productId: string, quantity: number) => ({ items: [{ productId, name: productId, quantity, price: 1 }] });
    const s = stats("0913", [order("0913", 1, 1, item("a", 1)), order("0913", 1, 2, item("b", 3)), order("0913", 1, 3, { ...item("a", 5), status: "cancelled" })]);
    expect(favoriteItems(s).map((f) => [f.item.productId, f.quantity])).toEqual([
      ["b", 3],
      ["a", 1],
    ]);
  });
});

test.describe("Bộ lọc và sắp xếp", () => {
  const orders = [order("0921", VIP_SPENT, 1), order("0922", 200_000, 5), order("0922", 200_000, 30), order("0923", 100_000, 90)];
  const people = [
    customer("0921", { name: "Nguyễn Văn Ánh", hasAccount: true, tags: ["Khách sỉ"], createdAt: ago(10) }),
    customer("0922", { name: "Trần Thị Bình", createdAt: ago(300) }),
    customer("0923", { name: "Lê Cường", blocked: true, createdAt: ago(100) }),
    customer("0924", { name: "Phạm Dung", email: "dung@mail.vn", createdAt: ago(1) }),
  ];
  const rows = people.map((c) => ({ customer: c, stats: customerStats(c, groupOrdersByPhone(orders), today) }));
  const run = (over: Partial<CustomerFilters>) => applyCustomerFilters(rows, { ...defaultCustomerFilters, ...over }).map((r) => r.customer.phone);

  test("Nhóm khách và đã chặn", () => {
    expect(run({ segment: "vip" })).toEqual(["0921"]);
    expect(run({ segment: "returning" })).toEqual(["0922"]);
    expect(run({ segment: "at-risk" })).toEqual(["0923"]);
    expect(run({ segment: "none" })).toEqual(["0924"]);
    expect(run({ segment: "blocked" })).toEqual(["0923"]);
  });
  test("Loại tài khoản và nhãn", () => {
    expect(run({ account: "account" })).toEqual(["0921"]);
    expect(run({ account: "guest" })).toHaveLength(3);
    expect(run({ tag: "Khách sỉ" })).toEqual(["0921"]);
  });
  test("Tìm tên không dấu, email, từ 3 số điện thoại", () => {
    expect(run({ q: "anh" })).toEqual(["0921"]);
    expect(run({ q: "dung@" })).toEqual(["0924"]);
    expect(run({ q: "922" })).toEqual(["0922"]);
    // Dưới 3 số không tìm theo điện thoại
    expect(run({ q: "09" })).toEqual([]);
  });
  test("4 cách sắp xếp, khách chưa mua xuống cuối khi xếp theo mua gần đây", () => {
    expect(run({ sort: "recent" })).toEqual(["0921", "0922", "0923", "0924"]);
    expect(run({ sort: "spent" })[0]).toBe("0921");
    expect(run({ sort: "orders" })[0]).toBe("0922");
    expect(run({ sort: "newest" })).toEqual(["0924", "0921", "0923", "0922"]);
  });
});
