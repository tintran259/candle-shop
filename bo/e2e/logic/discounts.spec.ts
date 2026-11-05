// Quy tắc mã giảm giá lúc tạo đơn và trạng thái tự tính (docs/pages/discounts.md)
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { discountStatus, normalizeCode, periodHint, randomCode } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { evaluateDiscount, orderTotals, type DraftLine } from "@/lib/orders/create";
import type { Order } from "@/lib/orders/types";

const day = (offset: number) => dayjs().add(offset, "day").format("YYYY-MM-DD");
const code = (over: Partial<Discount>): Discount => ({
  id: "x",
  code: "TEST",
  type: "percent",
  value: 10,
  scope: "all",
  firstOrderOnly: false,
  startsAt: day(-1),
  used: 0,
  active: true,
  createdAt: day(-1),
  ...over,
});
const product = (price: number, quantity = 1): DraftLine => ({ kind: "product", productId: "p", price, quantity });
const custom = (price: number, quantity = 1): DraftLine => ({ kind: "custom", custom: "Tự phối", price, quantity });
const pastOrder = (over: Partial<Order> = {}) => ({ status: "completed", discountCode: undefined, ...over }) as Order;
const run = (d: Discount, lines: DraftLine[], shipping = 0, previous: Order[] = []) => evaluateDiscount(d.code, [d], lines, shipping, previous);

test.describe("Trạng thái mã", () => {
  test("Đang chạy khi trong hạn và còn lượt", () => {
    expect(discountStatus(code({}))).toBe("running");
  });
  test("Tạm dừng ưu tiên trước mọi trạng thái khác", () => {
    expect(discountStatus(code({ active: false, endsAt: day(-5), usageLimit: 1, used: 1 }))).toBe("paused");
  });
  test("Hết hạn khi qua ngày kết thúc, ngày kết thúc hôm nay vẫn chạy", () => {
    expect(discountStatus(code({ endsAt: day(-1) }))).toBe("expired");
    expect(discountStatus(code({ endsAt: day(0) }))).toBe("running");
  });
  test("Hết lượt khi đạt giới hạn, hết hạn ưu tiên hơn hết lượt", () => {
    expect(discountStatus(code({ usageLimit: 5, used: 5 }))).toBe("exhausted");
    expect(discountStatus(code({ usageLimit: 5, used: 4 }))).toBe("running");
    expect(discountStatus(code({ usageLimit: 5, used: 5, endsAt: day(-1) }))).toBe("expired");
  });
  test("Lên lịch khi chưa tới ngày bắt đầu, kèm số ngày còn lại", () => {
    const d = code({ startsAt: day(3) });
    expect(discountStatus(d)).toBe("scheduled");
    expect(periodHint(d)?.text).toBe("Bắt đầu sau 3 ngày");
  });
  test("Nhắc sắp hết hạn trong 7 ngày", () => {
    expect(periodHint(code({ endsAt: day(0) }))).toEqual({ text: "Hết hạn hôm nay", urgent: true });
    expect(periodHint(code({ endsAt: day(7) }))?.urgent).toBe(true);
    expect(periodHint(code({ endsAt: day(8) }))?.urgent).toBe(false);
    expect(periodHint(code({}))).toBeNull();
  });
});

test.describe("Định dạng mã", () => {
  test("Viết hoa, bỏ dấu, bỏ khoảng trắng", () => {
    expect(normalizeCode("giảm giá đặc biệt")).toBe("GIAMGIADACBIET");
  });
  test("Mã ngẫu nhiên không có ký tự dễ nhầm 0, O, 1, I", () => {
    for (let i = 0; i < 50; i++) expect(randomCode()).toMatch(/^2510[A-HJ-NP-Z2-9]{5}$/);
  });
});

test.describe("Áp mã khi tạo đơn", () => {
  test("Không nhập mã thì không giảm, mã không có thì báo lỗi", () => {
    expect(evaluateDiscount("", [], [product(500_000)], 0, [])).toEqual({ amount: 0 });
    expect(evaluateDiscount("NOPE", [code({})], [product(500_000)], 0, []).error).toBe("Không có mã này.");
  });
  test("Khách gõ chữ thường và khoảng trắng vẫn nhận mã", () => {
    expect(evaluateDiscount("  test ", [code({})], [product(500_000)], 0, []).amount).toBe(50_000);
  });
  test("Mã không chạy thì báo đúng lý do", () => {
    expect(run(code({ active: false }), [product(500_000)]).error).toBe("Mã đang tạm dừng.");
    expect(run(code({ endsAt: day(-1) }), [product(500_000)]).error).toBe("Mã đã hết hạn.");
    expect(run(code({ usageLimit: 1, used: 1 }), [product(500_000)]).error).toBe("Mã đã hết lượt dùng.");
    expect(run(code({ startsAt: day(2) }), [product(500_000)]).error).toBe("Mã chưa tới ngày áp dụng.");
  });
  test("Đơn tối thiểu tính trên tạm tính, đúng bằng mức tối thiểu thì dùng được", () => {
    const d = code({ minOrder: 1_000_000 });
    // formatMoney dùng khoảng trắng không ngắt dòng trước ₫
    expect(run(d, [product(999_000)]).error).toMatch(/^Đơn từ 1\.000\.000\s₫ mới dùng được mã này\.$/);
    expect(run(d, [product(500_000, 2)]).amount).toBe(100_000);
  });
  test("Giảm % làm tròn tới nghìn đồng và không vượt mức tối đa", () => {
    expect(run(code({ value: 15 }), [product(333_000)]).amount).toBe(50_000);
    expect(run(code({ value: 15, maxDiscount: 200_000 }), [product(2_000_000)]).amount).toBe(200_000);
  });
  test("Giảm số tiền không vượt giá trị các dòng trong phạm vi", () => {
    expect(run(code({ type: "fixed", value: 100_000 }), [product(60_000)]).amount).toBe(60_000);
    expect(run(code({ type: "fixed", value: 100_000 }), [product(500_000)]).amount).toBe(100_000);
  });
  test("Phạm vi chỉ nến có sẵn: chỉ tính dòng nến có sẵn", () => {
    const d = code({ scope: "products", value: 10 });
    expect(run(d, [product(400_000), custom(600_000)]).amount).toBe(40_000);
    expect(run(d, [custom(600_000)]).error).toBe("Mã chỉ áp dụng cho nến có sẵn.");
  });
  test("Phạm vi chỉ nến tự phối: chỉ tính dòng tự phối", () => {
    const d = code({ scope: "custom", type: "fixed", value: 50_000 });
    expect(run(d, [product(400_000), custom(30_000)]).amount).toBe(30_000);
    expect(run(d, [product(400_000)]).error).toBe("Mã chỉ áp dụng cho nến tự phối.");
  });
  test("Miễn phí giao: giảm đúng phí giao, đơn đang miễn phí giao thì không dùng được", () => {
    const d = code({ type: "freeship", value: 0 });
    expect(run(d, [product(500_000)], 50_000).amount).toBe(50_000);
    expect(run(d, [product(500_000)], 0).error).toBe("Đơn đang miễn phí giao — mã không có tác dụng.");
  });
  test("Chỉ khách đặt lần đầu: khách có đơn hợp lệ thì bị chặn, đơn đã hủy không tính", () => {
    const d = code({ firstOrderOnly: true });
    expect(run(d, [product(500_000)], 0, [pastOrder()]).error).toBe("Mã chỉ dành cho khách đặt lần đầu.");
    expect(run(d, [product(500_000)], 0, [pastOrder({ status: "cancelled" })]).amount).toBe(50_000);
  });
  test("Giới hạn lượt mỗi khách: đếm đơn đã dùng mã, không tính đơn đã hủy", () => {
    const d = code({ perCustomerLimit: 1 });
    expect(run(d, [product(500_000)], 0, [pastOrder({ discountCode: "TEST" })]).error).toBe("Khách đã dùng hết lượt của mã này.");
    expect(run(d, [product(500_000)], 0, [pastOrder({ discountCode: "TEST", status: "cancelled" })]).amount).toBe(50_000);
    expect(run(code({ perCustomerLimit: 2 }), [product(500_000)], 0, [pastOrder({ discountCode: "TEST" })]).amount).toBe(50_000);
  });
});

test.describe("Mã riêng cho khách được chọn", () => {
  const vip = code({ code: "VYVIP", customerIds: ["cus-vy", "cus-an"] });
  test("Khách được chọn dùng được", () => {
    expect(evaluateDiscount("VYVIP", [vip], [product(500_000)], 0, [], "cus-vy").amount).toBe(50_000);
    expect(evaluateDiscount("VYVIP", [vip], [product(500_000)], 0, [], "cus-an").amount).toBe(50_000);
  });
  test("Khách khác hoặc chưa có hồ sơ khách thì từ chối", () => {
    expect(evaluateDiscount("VYVIP", [vip], [product(500_000)], 0, [], "cus-khac")).toEqual({ amount: 0, error: "Mã này dành riêng cho khách khác." });
    expect(evaluateDiscount("VYVIP", [vip], [product(500_000)], 0, []).error).toBe("Mã dành riêng cho khách được chọn — nhập đúng số điện thoại của khách.");
  });
  test("Mã không chọn khách thì ai cũng dùng được", () => {
    expect(evaluateDiscount("TEST", [code({ customerIds: [] })], [product(500_000)], 0, [], "cus-khac").amount).toBe(50_000);
  });
});

test.describe("Tổng tiền đơn", () => {
  test("Tổng = tạm tính − giảm + phí giao, cọc làm tròn tới nghìn đồng", () => {
    expect(orderTotals([product(333_333, 3)], 50_000, "deposit", 100_000, 30)).toEqual({ subtotal: 999_999, discount: 100_000, shippingFee: 50_000, total: 949_999, dueNow: 285_000 });
  });
  test("Trả đủ thì thu ngay toàn bộ, tổng không âm", () => {
    expect(orderTotals([product(100_000)], 0, "full", 0, 50).dueNow).toBe(100_000);
    expect(orderTotals([product(50_000)], 0, "full", 80_000, 50).total).toBe(0);
  });
});
