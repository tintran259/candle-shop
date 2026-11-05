// Vận chuyển và xuất Excel: link tra cứu, mã vận đơn, thu hộ, tìm theo mã vận đơn, file Excel đơn hàng (docs/pages/orders.md#vận-chuyển)
import { expect, test } from "@playwright/test";
import { applyOrderFilters, defaultOrderFilters } from "@/lib/orders/filters";
import { ordersSheets } from "@/lib/orders/export";
import { codAmount, itemsSummary, normalizeTrackingCode, shipmentText, trackingOwner } from "@/lib/orders/shipping";
import type { Order } from "@/lib/orders/types";
import { trackingLink } from "@/lib/settings/types";
import { xlsxBlob } from "@/lib/xlsx";
import { readXlsx } from "../support/xlsx";

const order = (over: Partial<Order> & { code: string }) =>
  ({
    id: over.code,
    status: "shipping",
    createdAt: "2026-11-03T02:00:00.000Z",
    readyDate: "2026-11-06",
    customer: { name: "Khách", email: "", phone: "0900 000 000" },
    shippingAddress: "12 Lý Thường Kiệt",
    shippingMethod: "standard",
    shippingName: "Tiêu chuẩn (3 ngày)",
    paymentPlan: "deposit",
    paymentMethod: "cod",
    payments: [{ id: "p", provider: "cod", amount: 300_000, status: "success", createdAt: "2026-11-03T02:00:00.000Z" }],
    items: [
      { id: "a", name: "Moon Morning", price: 250_000, quantity: 2 },
      { id: "b", name: "Nến tự phối", custom: "Hũ gốm · 150 ml", price: 300_000, quantity: 1 },
    ],
    subtotal: 800_000,
    discount: 0,
    shippingFee: 30_000,
    total: 830_000,
    history: [],
    ...over,
  }) as unknown as Order;

test.describe("Mã vận đơn", () => {
  test("Link tra cứu thay {code}, không có mẫu thì không có link", () => {
    expect(trackingLink("https://donhang.ghn.vn/?order_code={code}", "GHN 1/2")).toBe("https://donhang.ghn.vn/?order_code=GHN%201%2F2");
    expect(trackingLink(undefined, "X")).toBeUndefined();
    expect(trackingLink("https://a.vn/track", "X")).toBeUndefined();
    expect(trackingLink("https://a.vn/{code}", undefined)).toBeUndefined();
  });

  test("Chuẩn hóa mã: bỏ khoảng trắng, viết hoa", () => {
    expect(normalizeTrackingCode(" ghn 8xk 2p ")).toBe("GHN8XK2P");
    expect(normalizeTrackingCode()).toBe("");
  });

  test("Mã trùng: bỏ qua chính đơn đó và đơn đã hủy", () => {
    const ship = (code: string) => ({ carrierId: "ghn", carrier: "Giao Hàng Nhanh", trackingCode: code, at: "" });
    const list = [order({ code: "A", shipment: ship("X1") }), order({ code: "B", status: "cancelled", shipment: ship("X2") })];
    expect(trackingOwner(list, "X1")?.code).toBe("A");
    expect(trackingOwner(list, "X1", "A")).toBeUndefined();
    expect(trackingOwner(list, "X2")).toBeUndefined();
    expect(trackingOwner(list, "")).toBeUndefined();
  });

  test("Thu hộ = phần khách còn phải trả; nội dung hàng và lịch sử", () => {
    expect(codAmount(order({ code: "A" }))).toBe(530_000);
    expect(codAmount(order({ code: "A", payments: [{ id: "p", provider: "vnpay", amount: 830_000, status: "success", createdAt: "" }] }))).toBe(0);
    expect(itemsSummary(order({ code: "A" }))).toBe("3 sản phẩm: 2× Moon Morning, 1× Nến tự phối");
    expect(shipmentText({ carrierId: "self", carrier: "Shop tự giao", at: "" })).toBe("Shop tự giao");
    expect(shipmentText({ carrierId: "ghn", carrier: "GHN", trackingCode: "X1", at: "" })).toBe("GHN · mã vận đơn X1");
  });

  test("Tìm đơn theo mã vận đơn", () => {
    const list = [order({ code: "SC1", shipment: { carrierId: "ghn", carrier: "GHN", trackingCode: "GHNABC123", at: "" } }), order({ code: "SC2" })];
    expect(applyOrderFilters(list, { ...defaultOrderFilters, q: "abc123" }).map((o) => o.code)).toEqual(["SC1"]);
  });
});

test.describe("Xuất Excel đơn hàng", () => {
  test("Trang Đơn hàng: mỗi đơn một dòng, tiền là số, có mã vận đơn; trang Sản phẩm: mỗi sản phẩm một dòng", async () => {
    const o = order({ code: "SC251103-01", note: 'Gói quà <đỏ> & "nơ"', shipment: { carrierId: "ghn", carrier: "Giao Hàng Nhanh", trackingCode: "GHN123", at: "" } });
    const [orders, items] = readXlsx(Buffer.from(await xlsxBlob(ordersSheets([o])).arrayBuffer()));
    expect(orders.name).toBe("Đơn hàng");
    const head = orders.rows[0];
    const row = Object.fromEntries(head.map((h, i) => [h, orders.rows[1][i]]));
    expect(orders.rows).toHaveLength(2);
    expect(row["Mã đơn"]).toBe("SC251103-01");
    expect(row["Trạng thái"]).toBe("Đang giao");
    expect(row["Sản phẩm"]).toBe("2× Moon Morning; 1× Nến tự phối");
    expect(row["Tổng tiền"]).toBe("830000");
    expect(row["Đã thu"]).toBe("300000");
    expect(row["Còn phải thu"]).toBe("530000");
    expect(row["Đơn vị vận chuyển"]).toBe("Giao Hàng Nhanh");
    expect(row["Mã vận đơn"]).toBe("GHN123");
    expect(row["Ghi chú của khách"]).toBe('Gói quà <đỏ> & "nơ"');
    // Ngày đặt là ngày giờ Excel thật (lọc, sắp xếp được), không phải chữ
    expect(Number(row["Ngày đặt"])).toBeGreaterThan(46_000);
    expect(orders.xml).toContain('<autoFilter ref="A1:');
    expect(orders.xml).toContain('state="frozen"');

    expect(items.name).toBe("Sản phẩm");
    expect(items.rows).toHaveLength(3);
    expect(items.rows[2]).toEqual(expect.arrayContaining(["SC251103-01", "Nến tự phối", "Hũ gốm · 150 ml", "1", "300000"]));
  });

  test("Đơn đã hủy không còn phải thu", async () => {
    const [orders] = readXlsx(Buffer.from(await xlsxBlob(ordersSheets([order({ code: "H", status: "cancelled" })])).arrayBuffer()));
    const i = orders.rows[0].indexOf("Còn phải thu");
    expect(orders.rows[1][i]).toBe("0");
  });
});
