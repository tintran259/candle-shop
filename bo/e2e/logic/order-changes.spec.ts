// Sửa đơn sau khi tạo, khiếu nại sau khi giao, khoản hoàn một phần (docs/pages/orders.md, docs/workflow.md mục 7)
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { buildReplacement, maxComplaintRefund, recordComplaint } from "@/lib/orders/complaint";
import type { DraftLine } from "@/lib/orders/create";
import { applyEdit, itemsEditable, orderEditable } from "@/lib/orders/edit";
import { overpaid, paidAmount, partialRefunds, paymentState, remaining } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";

const at = dayjs("2026-11-03T10:00:00");
const base = (over: Partial<Order> = {}): Order =>
  ({
    id: "o1",
    code: "SC261103001",
    status: "paid",
    customer: { name: "Nguyễn Ánh", phone: "0912345678", email: "" },
    shippingAddress: "1 Lê Lợi",
    shippingMethod: "standard",
    shippingName: "Tiêu chuẩn (3 ngày)",
    shippingDays: 3,
    depositPercent: 50,
    items: [
      { id: "a", productId: "moon", name: "Moon", price: 400_000, quantity: 2 },
      { id: "b", name: "Nến tự phối", custom: "Hũ gốm", price: 300_000, quantity: 1 },
    ],
    subtotal: 1_100_000,
    discount: 0,
    shippingFee: 0,
    total: 1_100_000,
    paymentPlan: "deposit",
    paymentMethod: "cod",
    payments: [{ id: "p1", provider: "cod", amount: 550_000, status: "success", createdAt: at.toISOString() }],
    readyDate: "2026-11-06",
    history: [],
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
    ...over,
  }) as Order;
const line = (name: string, price: number, quantity: number): DraftLine => ({ kind: "product", productId: name, name, price, quantity });
const input = (o: Order, over = {}) => ({ customer: o.customer, shippingAddress: o.shippingAddress, shippingFee: o.shippingFee, readyDate: o.readyDate, note: o.note, internalNote: o.internalNote, ...over });

test.describe("Sửa đơn", () => {
  test("Sửa sản phẩm khi Chờ thanh toán và Đã thanh toán; sau đó chỉ sửa liên hệ, giao hàng", () => {
    expect(["pending", "paid"].every((s) => itemsEditable(s as Order["status"]))).toBe(true);
    expect(["producing", "ready", "shipping", "returned"].some((s) => itemsEditable(s as Order["status"]))).toBe(false);
    expect(orderEditable("producing")).toBe(true);
    expect(orderEditable("completed") || orderEditable("cancelled")).toBe(false);
  });

  test("Không đổi gì thì không ghi lịch sử", () => {
    const o = base();
    const r = applyEdit(o, input(o), "Admin", at);
    expect(r.changes).toEqual([]);
    expect(r.order).toBe(o);
  });

  test("Đổi sản phẩm: tính lại tạm tính, tổng; ghi lịch sử từng thay đổi", () => {
    const o = base();
    const { order, changes } = applyEdit(o, input(o, { lines: [line("Moon", 400_000, 3)], shippingAddress: "9 Pasteur", readyDate: "2026-11-08" }), "Admin", at);
    expect(order).toMatchObject({ subtotal: 1_200_000, total: 1_200_000, shippingAddress: "9 Pasteur", readyDate: "2026-11-08" });
    expect(order.items.map((i) => [i.name, i.quantity])).toEqual([["Moon", 3]]);
    expect(changes).toEqual(["Địa chỉ giao: 9 Pasteur", "Ngày làm xong: 08/11/2026", "Sản phẩm: Moon ×3", expect.stringMatching(/^Tổng 1\.100\.000\s₫ → 1\.200\.000\s₫$/)]);
    expect(order.history.at(-1)).toMatchObject({ kind: "edit", status: "paid", by: "Admin" });
    // Đã cọc 550.000: còn phải thu tăng theo tổng mới
    expect(remaining(order)).toBe(650_000);
  });

  test("Chờ thanh toán: khoản đang chờ thu đổi theo tổng mới", () => {
    const o = base({ status: "pending", payments: [{ id: "p1", provider: "cod", amount: 550_000, status: "pending", createdAt: at.toISOString() }] });
    const { order } = applyEdit(o, input(o, { lines: [line("Moon", 400_000, 1)] }), "Admin", at);
    expect(order.payments[0].amount).toBe(200_000);
  });

  test("Sau khi Bắt đầu làm: sản phẩm giữ nguyên dù form gửi dòng mới", () => {
    const o = base({ status: "producing" });
    const { order, changes } = applyEdit(o, input(o, { lines: [line("Moon", 1, 1)], customer: { ...o.customer, phone: "0987654321" } }), "Admin", at);
    expect(order.items).toEqual(o.items);
    expect(order.total).toBe(1_100_000);
    expect(changes).toEqual(["Số điện thoại: 0987654321"]);
  });

  test("Bớt hàng sau khi đã trả đủ: thu dư cần hoàn", () => {
    const o = base({ paymentPlan: "full", payments: [{ id: "p1", provider: "cod", amount: 1_100_000, status: "success", createdAt: at.toISOString() }] });
    const { order } = applyEdit(o, input(o, { lines: [line("Moon", 400_000, 2)] }), "Admin", at);
    expect(order.total).toBe(800_000);
    expect(overpaid(order)).toBe(300_000);
    expect(remaining(order)).toBe(0);
  });

  test("Mã giảm giá và phí giao", () => {
    const o = base();
    const discount = { amount: 100_000, discount: { code: "GIAM100" } as never };
    const { order, changes } = applyEdit(o, input(o, { lines: [line("Moon", 400_000, 2)], discount, shippingFee: 50_000 }), "Admin", at);
    expect(order).toMatchObject({ discount: 100_000, discountCode: "GIAM100", shippingFee: 50_000, total: 750_000 });
    expect(changes).toContain("Mã giảm giá: GIAM100");
    const removed = applyEdit(order, input(order, { lines: [line("Moon", 400_000, 2)], discount: { amount: 0 } }), "Admin", at).order;
    expect(removed.discountCode).toBeUndefined();
  });
});

test.describe("Khoản hoàn một phần", () => {
  test("Khoản hoàn là số âm: tiền shop giữ, phần đã hoàn đều đúng", () => {
    const o = base({ payments: [{ id: "p1", provider: "cod", amount: 1_100_000, status: "success", createdAt: at.toISOString() }, { id: "r1", provider: "cod", amount: -200_000, status: "success", kind: "refund", createdAt: at.toISOString() }] });
    expect(paidAmount(o)).toBe(900_000);
    expect(partialRefunds(o)).toBe(200_000);
    expect(paymentState(o)).toBe("deposit");
  });
});

test.describe("Khiếu nại sau khi giao", () => {
  const done = base({ status: "completed", payments: [{ id: "p1", provider: "cod", amount: 1_100_000, status: "success", createdAt: at.toISOString() }] });

  test("Gửi bù: đơn mới 0 ₫, đúng cây và số lượng, vào Đã thanh toán, liên kết đơn gốc", () => {
    const r = buildReplacement(done, [{ itemId: "a", quantity: 1 }, { itemId: "b", quantity: 0 }], { readyDate: "2026-11-07", reason: "Vỡ hũ", by: "Admin" }, [done], at);
    expect(r).toMatchObject({ status: "paid", total: 0, subtotal: 0, shippingFee: 0, payments: [], readyDate: "2026-11-07", replacementFor: { id: "o1", code: "SC261103001" } });
    expect(r.items.map((i) => [i.name, i.quantity, i.price])).toEqual([["Moon", 1, 0]]);
    expect(r.code).not.toBe(done.code);
    expect(paymentState(r)).toBe("paid");
    expect(remaining(r)).toBe(0);
  });

  test("Gửi bù không vượt số lượng của đơn gốc", () => {
    const r = buildReplacement(done, [{ itemId: "a", quantity: 9 }], { readyDate: "2026-11-07", reason: "Vỡ", by: "Admin" }, [done], at);
    expect(r.items[0].quantity).toBe(2);
  });

  test("Ghi khiếu nại có gửi bù: lịch sử nhắc mã đơn gửi bù", () => {
    const replacement = buildReplacement(done, [{ itemId: "a", quantity: 1 }], { readyDate: "2026-11-07", reason: "Vỡ hũ", by: "Admin" }, [done], at);
    const o = recordComplaint(done, { reason: "Vỡ hũ", images: [], resolution: "resend", replacement, by: "Admin" }, at);
    expect(o.status).toBe("completed");
    expect(o.complaints?.[0]).toMatchObject({ resolution: "resend", replacementCode: replacement.code });
    expect(o.history.at(-1)?.note).toBe(`Khiếu nại: Vỡ hũ · gửi bù đơn ${replacement.code}`);
    expect(o.payments).toHaveLength(1);
  });

  test("Hoàn một phần: thêm khoản hoàn âm có ảnh chứng từ, giảm tiền shop giữ", () => {
    const o = recordComplaint(done, { reason: "Cháy lệch", images: ["x"], resolution: "refund", refundAmount: 150_000, refundImages: ["ct"], by: "Admin" }, at);
    expect(o.payments.at(-1)).toMatchObject({ amount: -150_000, kind: "refund", status: "success", images: ["ct"] });
    expect(paidAmount(o)).toBe(950_000);
    expect(maxComplaintRefund(o)).toBe(950_000);
    expect(o.history.at(-1)?.note).toMatch(/^Khiếu nại: Cháy lệch · hoàn 150\.000\s₫$/);
  });

  test("Chỉ ghi nhận: không đổi tiền", () => {
    const o = recordComplaint(done, { reason: "Mùi nhẹ hơn mong đợi", images: [], resolution: "none", by: "Admin" }, at);
    expect(paidAmount(o)).toBe(1_100_000);
    expect(o.complaints?.[0].resolution).toBe("none");
  });
});
