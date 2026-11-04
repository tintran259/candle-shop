// Giá vốn, lãi gộp, giá nhập bình quân, công suất xưởng (docs/pages/inventory.md, docs/pages/settings.md)
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { candleCount, dayLoad, productionLoad, suggestReadyDate, workshopSchedule } from "@/lib/capacity";
import { averageCost, goodsValue, lotPreview, lotTotal, margin, needsCost, orderCost, purchaseCost, purchaseFrom, purchaseUnits, unitPrice } from "@/lib/costs";
import { defaultCraftConfig } from "@/lib/craft/default-config";
import { toMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import type { Order } from "@/lib/orders/types";
import type { Product } from "@/lib/products/types";

const mat = (id: string, unitCost?: number, tracked = true) => ({ id, name: id, category: "wax", unit: "g", tracked, stock: 1000, lowStock: 0, updatedAt: "", unitCost }) as Material;

test.describe("Giá nhập và giá vốn", () => {
  test("Giá nhập bình quân gia quyền; chưa có giá hoặc hết tồn thì lấy giá mới", () => {
    expect(averageCost(1000, 80, 1000, 100)).toBe(90);
    expect(averageCost(3000, 80, 1000, 120)).toBe(90);
    expect(averageCost(0, 80, 500, 120)).toBe(120);
    expect(averageCost(500, undefined, 500, 120)).toBe(120);
    // Giữ 2 chữ số lẻ
    expect(averageCost(1000, 60, 2000, 59.8)).toBe(59.87);
  });
  test("Giá mỗi đơn vị từ tổng tiền mua: 5 kg giá 300.000 ₫ = 60 ₫/g", () => {
    expect(unitPrice(300_000, 5000)).toBe(60);
    expect(unitPrice(299_000, 5000)).toBe(59.8);
    expect(unitPrice(250_000, 100)).toBe(2500);
    expect(unitPrice(100_000, 3)).toBe(33333.33);
    expect(unitPrice(300_000, 0)).toBeUndefined();
  });
  test("Mua theo kg, lít quy về g, ml", () => {
    expect(purchaseUnits.g.find((u) => u.value === "kg")?.factor).toBe(1000);
    expect(purchaseUnits.ml.find((u) => u.value === "l")?.factor).toBe(1000);
    expect(purchaseUnits.pcs).toEqual([{ value: "pcs", label: "cái", factor: 1 }]);
    expect(purchaseCost("g", { qty: 5, unit: "kg", price: 300_000 })).toBe(60);
    expect(purchaseCost("g", { qty: 500, unit: "g", price: 45_000 })).toBe(90);
    expect(purchaseCost("g", { qty: 5, unit: "kg", price: null })).toBeUndefined();
    expect(purchaseCost("g", { qty: 0, unit: "kg", price: 300_000 })).toBeUndefined();
    // Điền lại theo 1 kg: 59,8 ₫/g = 59.800 ₫/kg
    expect(purchaseFrom("g", 59.8)).toEqual({ qty: 1, unit: "kg", price: 59_800 });
    expect(purchaseFrom("pcs")).toEqual({ qty: 1, unit: "pcs", price: null });
  });
  test("Tiền lô bắt buộc: tổng đã trả, hoặc không mất tiền = 0 ₫", () => {
    expect(lotTotal({ total: 120_000 })).toBe(120_000);
    expect(lotTotal({ total: 120_000, free: true })).toBe(0);
    expect(lotTotal({ total: null })).toBeUndefined();
    expect(lotTotal({})).toBeUndefined();
    expect(lotTotal()).toBeUndefined();
  });
  test("Xem trước phiếu nhập: giá lô và bình quân sau phiếu", () => {
    expect(lotPreview(9000, 90, 1000, { total: 120_000 })).toEqual({ price: 120, average: 93 });
    // Hàng tặng kéo bình quân xuống
    expect(lotPreview(9000, 90, 1000, { free: true })).toEqual({ price: 0, average: 81 });
    // Chưa có giá hoặc hết tồn thì lấy giá lô
    expect(lotPreview(0, undefined, 200, { total: 440_000 })).toEqual({ price: 2200, average: 2200 });
    expect(lotPreview(9000, 90, null, { total: 120_000 })).toBeUndefined();
    expect(lotPreview(9000, 90, 1000, {})).toBeUndefined();
  });
  test("Tiền nguyên liệu theo lượng × giá nhập; nguyên liệu chưa có giá thì báo thiếu", () => {
    const map = toMap([mat("wax", 90), mat("oil", 2000), mat("jar")]);
    const r = needsCost(new Map([["wax", 150], ["oil", 10], ["jar", 1]]), map);
    expect(r.cost).toBe(33_500);
    expect(r.missing.map((m) => m.id)).toEqual(["jar"]);
  });
  test("Giá vốn đơn: đã làm thì lấy số đã chốt, chưa làm thì ước tính từ công thức", () => {
    const map = toMap([mat("wax", 100), mat("jar", 20_000)]);
    const products = [{ id: "p", recipe: [{ materialId: "wax", quantity: 150 }, { materialId: "jar", quantity: 1 }] }] as Product[];
    const order = { items: [{ productId: "p", quantity: 2 }] } as unknown as Order;
    expect(orderCost(order, { config: defaultCraftConfig, map, products })).toMatchObject({ cost: 70_000, final: false });
    expect(orderCost({ ...order, materialCost: 65_000 }, { config: defaultCraftConfig, map, products })).toMatchObject({ cost: 65_000, final: true });
  });
  test("Lãi gộp trên giá trị hàng: tạm tính − giảm giá − tiền hoàn do khiếu nại, không tính phí giao", () => {
    const o = { subtotal: 1_000_000, discount: 100_000, shippingFee: 50_000, complaints: [{ refundAmount: 50_000 }, { resolution: "none" }] } as unknown as Order;
    expect(goodsValue(o)).toBe(850_000);
    // Hoàn phần thu dư sau khi sửa đơn không làm giảm giá trị hàng
    expect(goodsValue({ ...o, complaints: [], payments: [{ amount: -300_000, status: "success", kind: "refund" }] } as unknown as Order)).toBe(900_000);
    expect(margin(850_000, 250_000)).toEqual({ profit: 600_000, percent: 600_000 / 850_000 });
    expect(margin(0, 80_000)).toEqual({ profit: -80_000, percent: null });
  });
});

test.describe("Công suất xưởng", () => {
  const today = dayjs("2026-11-03T08:00:00");
  const order = (readyDate: string, quantity: number, status: Order["status"] = "paid", id = readyDate + quantity) => ({ id, readyDate, status, items: [{ quantity }] }) as unknown as Order;
  const orders = [order("2026-11-06", 15), order("2026-11-06", 4, "pending"), order("2026-11-07", 20, "producing"), order("2026-11-06", 30, "ready"), order("2026-11-08", 50, "cancelled")];

  test("Chỉ tính đơn chưa làm xong, cộng theo số cây", () => {
    const load = productionLoad(orders);
    expect(load.get("2026-11-06")).toBe(19);
    expect(load.get("2026-11-07")).toBe(20);
    expect(load.has("2026-11-08")).toBe(false);
    expect(candleCount([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
  });
  test("Đơn đang sửa không tự chiếm chỗ của chính nó", () => {
    expect(productionLoad(orders, "2026-11-0615").get("2026-11-06")).toBe(4);
  });
  test("Còn chỗ, vượt công suất; 0 là không giới hạn", () => {
    const load = productionLoad(orders);
    expect(dayLoad(load, "2026-11-06", 20, 1)).toMatchObject({ load: 20, free: 0, over: false });
    expect(dayLoad(load, "2026-11-06", 20, 2).over).toBe(true);
    expect(dayLoad(load, "2026-11-06", 0, 99).over).toBe(false);
  });
  test("Gợi ý ngày làm xong: từ hôm nay + số ngày tối thiểu, bỏ qua ngày không đủ chỗ", () => {
    const load = productionLoad(orders);
    const opts = { capacity: 20, leadDays: 3 };
    expect(suggestReadyDate(load, 1, opts, today)).toBe("2026-11-06");
    expect(suggestReadyDate(load, 2, opts, today)).toBe("2026-11-08");
    // Đơn lớn hơn công suất một ngày: lấy ngày còn trống hẳn
    expect(suggestReadyDate(load, 25, opts, today)).toBe("2026-11-08");
    expect(suggestReadyDate(load, 500, { capacity: 0, leadDays: 2 }, today)).toBe("2026-11-05");
  });
  test("Lịch xưởng 7 ngày tới", () => {
    const rows = workshopSchedule(orders, 20, 7, today);
    expect(rows).toHaveLength(7);
    expect(rows[0].date).toBe("2026-11-03");
    expect(rows.find((r) => r.date === "2026-11-07")).toMatchObject({ load: 20, free: 0, over: false });
  });
});
