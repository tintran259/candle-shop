// Đơn hàng: bộ lọc danh sách, tình trạng thanh toán, bước tiếp theo, hạn làm xong, số tiền hoàn (docs/pages/orders.md, docs/workflow.md)
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { applyOrderFilters, defaultOrderFilters, type OrderFilters } from "@/lib/orders/filters";
import { canCancel, deadline, nextStatus, paymentState, refundFor } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";

const today = dayjs("2026-11-03T09:00:00");
const pay = (amount: number, status = "success") => ({ status, amount, createdAt: today.toISOString() });
const order = (over: Partial<Order> & { code: string }) =>
  ({
    id: over.code,
    status: "paid",
    createdAt: today.toISOString(),
    readyDate: today.add(3, "day").format("YYYY-MM-DD"),
    customer: { name: "Khách", phone: "0900 000 000" },
    payments: [],
    items: [],
    total: 1_000_000,
    ...over,
  }) as unknown as Order;

test.describe("Tình trạng thanh toán", () => {
  test("Chưa thanh toán, đã cọc, đã thanh toán đủ", () => {
    expect(paymentState(order({ code: "A" }))).toBe("unpaid");
    expect(paymentState(order({ code: "A", payments: [pay(500_000), pay(500_000, "pending")] as Order["payments"] }))).toBe("deposit");
    expect(paymentState(order({ code: "A", payments: [pay(1_000_000)] as Order["payments"] }))).toBe("paid");
  });
  test("Chờ hoàn tiền rồi đã hoàn tiền", () => {
    expect(paymentState(order({ code: "A", payments: [pay(500_000)] as Order["payments"], refundDue: 500_000 }))).toBe("refunding");
    expect(paymentState(order({ code: "A", refundDue: 500_000, refund: { amount: 500_000 } as Order["refund"] }))).toBe("refunded");
  });
});

test.describe("Số tiền hoàn khi hủy", () => {
  const paid = (amount: number, over: Partial<Order> = {}) => order({ code: "R", payments: [pay(amount)] as Order["payments"], ...over });
  test("Lỗi do shop hoàn toàn bộ tiền đã thu", () => {
    expect(refundFor(paid(1_000_000), "shop")).toBe(1_000_000);
  });
  test("Lỗi do khách: mới cọc thì không hoàn, trả đủ thì hoàn tổng trừ cọc", () => {
    expect(refundFor(paid(500_000), "customer")).toBe(0);
    expect(refundFor(paid(1_000_000), "customer")).toBe(500_000);
    expect(refundFor(paid(1_000_000, { depositPercent: 30 }), "customer")).toBe(700_000);
  });
  test("Cọc tính trên tổng trước phí gửi lại", () => {
    expect(refundFor(paid(1_030_000, { total: 1_030_000, resendFee: 30_000 }), "customer")).toBe(530_000);
  });
});

test.describe("Bước tiếp theo, hủy được, hạn làm xong", () => {
  test("Đi đúng thứ tự trạng thái", () => {
    expect(["pending", "paid", "producing", "ready", "shipping"].map((s) => nextStatus(s as Order["status"]))).toEqual(["paid", "producing", "ready", "shipping", "completed"]);
    expect(nextStatus("completed")).toBeUndefined();
  });
  test("Hủy được trước khi giao hoặc khi đã hoàn về", () => {
    expect(["pending", "paid", "producing", "ready", "returned"].every((s) => canCancel(s as Order["status"]))).toBe(true);
    expect(["shipping", "delivery_failed", "returning", "completed", "cancelled"].some((s) => canCancel(s as Order["status"]))).toBe(false);
  });
  test("Nhãn hạn: trễ, hôm nay, ngày mai, còn N ngày; đơn đã làm xong thì không có hạn", () => {
    const due = (offset: number, status: Order["status"] = "producing") => deadline(order({ code: "D", status, readyDate: today.add(offset, "day").format("YYYY-MM-DD") }), today);
    expect(due(-2)).toEqual({ label: "Trễ 2 ngày", tone: "danger" });
    expect(due(0)?.label).toBe("Hôm nay");
    expect(due(1)?.label).toBe("Ngày mai");
    expect(due(5)).toEqual({ label: "Còn 5 ngày", tone: "secondary" });
    expect(due(-2, "ready")).toBeNull();
  });
});

test.describe("Bộ lọc danh sách đơn", () => {
  const list = [
    order({ code: "SC261101001", status: "pending", createdAt: today.subtract(2, "day").toISOString(), customer: { name: "Nguyễn Ánh", phone: "0912 345 678" }, total: 500_000, readyDate: "2026-11-09" } as never),
    order({ code: "SC261102002", status: "paid", createdAt: today.subtract(1, "day").toISOString(), customer: { name: "Trần Bình", phone: "0987 654 321" }, payments: [pay(400_000)], total: 800_000, readyDate: "2026-11-05" } as never),
    order({ code: "SC261103003", status: "completed", createdAt: today.toISOString(), customer: { name: "Lê Cường", phone: "0903 112 233" }, payments: [pay(2_000_000)], total: 2_000_000, readyDate: "2026-11-04" } as never),
  ];
  const run = (over: Partial<OrderFilters>) => applyOrderFilters(list, { ...defaultOrderFilters, ...over }).map((o) => o.code);

  test("Theo trạng thái và tình trạng thanh toán", () => {
    expect(run({ status: "paid" })).toEqual(["SC261102002"]);
    expect(run({ payment: "deposit" })).toEqual(["SC261102002"]);
    expect(run({ payment: "unpaid" })).toEqual(["SC261101001"]);
    expect(run({ payment: "paid" })).toEqual(["SC261103003"]);
  });
  test("Khoảng ngày đặt tính cả hai đầu", () => {
    expect(run({ range: ["2026-11-01", "2026-11-02"] })).toEqual(["SC261102002", "SC261101001"]);
    expect(run({ range: ["2026-11-03", "2026-11-03"] })).toEqual(["SC261103003"]);
  });
  test("Tìm theo mã đơn, tên không dấu, từ 3 số điện thoại", () => {
    expect(run({ q: "sc261103" })).toEqual(["SC261103003"]);
    expect(run({ q: "nguyen anh" })).toEqual(["SC261101001"]);
    expect(run({ q: "654 321" })).toEqual(["SC261102002"]);
  });
  test("3 cách sắp xếp", () => {
    expect(run({ sort: "newest" })).toEqual(["SC261103003", "SC261102002", "SC261101001"]);
    expect(run({ sort: "ready-soon" })).toEqual(["SC261103003", "SC261102002", "SC261101001"]);
    expect(run({ sort: "total-desc" })).toEqual(["SC261103003", "SC261102002", "SC261101001"]);
    // Tổng cao nhất không phụ thuộc ngày đặt
    expect(applyOrderFilters([...list].reverse(), { ...defaultOrderFilters, sort: "total-desc" }).map((o) => o.total)).toEqual([2_000_000, 800_000, 500_000]);
  });
});
