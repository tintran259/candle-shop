// Chuyển file sao lưu BO (dữ liệu mẫu thật, tạo từ BO) thành dữ liệu từng bảng
import { readFileSync } from "node:fs";
import { mapBackup, type BackupFile } from "./map-backup.js";

const sample = JSON.parse(readFileSync(new URL("../../test/fixtures/bo-backup-sample.json", import.meta.url), "utf8")) as BackupFile;
const raw = (key: string) => JSON.parse(sample.data[key]);

describe("mapBackup", () => {
  const { data, warnings } = mapBackup(sample);

  it("từ chối file không phải sao lưu của BO", () => {
    expect(() => mapBackup({ app: "khac", version: 1, exportedAt: "", data: {} })).toThrow("Không phải file sao lưu");
  });

  it("giữ đủ số bản ghi từng nhóm", () => {
    const inv = raw("bo-inventory-v2");
    expect(data.orders).toHaveLength(raw("bo-orders-v4").length);
    expect(data.products).toHaveLength(raw("bo-products-v2").length);
    expect(data.customers).toHaveLength(raw("bo-customers-v1").length);
    expect(data.discounts).toHaveLength(raw("bo-discounts-v1").length);
    expect(data.materials).toHaveLength(inv.materials.length);
    expect(data.movements).toHaveLength(inv.movements.length);
    expect(data.categories.length).toBeGreaterThanOrEqual(raw("bo-categories-v1").length);
    expect(data.cancelled).toHaveLength(raw("bo-cancelled-products-v4").length);
    expect(data.craft.map((c) => c.id)).toEqual(["saved"]);
    expect(warnings).toEqual([]);
  });

  it("đơn: dòng hàng, khoản thu, lịch sử, tiền giữ đúng", () => {
    const orders = raw("bo-orders-v4");
    const o = orders.find((x: { payments: unknown[] }) => x.payments.length > 1) ?? orders[0];
    const mapped = data.orders.find((x) => x.id === o.id)!;
    expect(mapped).toMatchObject({ code: o.code, status: o.status, customerPhone: o.customer.phone, total: o.total, subtotal: o.subtotal, shippingFee: o.shippingFee, readyDate: o.readyDate });
    expect(data.orderItems.filter((i) => i.orderId === o.id)).toHaveLength(o.items.length);
    expect(data.payments.filter((p) => p.orderId === o.id).map((p) => p.amount)).toEqual(o.payments.map((p: { amount: number }) => p.amount));
    const events = data.events.filter((e) => e.orderId === o.id);
    expect(events.map((e) => e.status)).toEqual(o.history.map((e: { status: string }) => e.status));
    expect(events.map((e) => e.sortOrder)).toEqual(o.history.map((_: unknown, i: number) => i));
    // id con gắn kèm id đơn để không trùng giữa các đơn
    expect(new Set(data.orderItems.map((i) => i.id)).size).toBe(data.orderItems.length);
    expect(new Set(data.payments.map((p) => p.id)).size).toBe(data.payments.length);
  });

  it("cài đặt, phương thức giao, đơn vị vận chuyển", () => {
    const s = raw("bo-settings-v1");
    expect(data.settings).toMatchObject({ id: "shop", depositPercent: s.depositPercent, senderName: s.sender.name });
    expect(data.shippingOptions.map((o) => o.id)).toEqual(s.shippingOptions.map((o: { id: string }) => o.id));
    expect(data.carriers.map((c) => c.id)).toEqual(s.carriers.map((c: { id: string }) => c.id));
  });

  it("công thức sản phẩm, mã riêng: bỏ tham chiếu tới mục không còn và báo lại", () => {
    const file: BackupFile = JSON.parse(JSON.stringify(sample));
    const products = JSON.parse(file.data["bo-products-v2"]);
    products[0].recipe = [...(products[0].recipe ?? []), { materialId: "khong-con", quantity: 1 }];
    file.data["bo-products-v2"] = JSON.stringify(products);
    const discounts = JSON.parse(file.data["bo-discounts-v1"]);
    discounts[0].customerIds = ["khach-khong-con"];
    file.data["bo-discounts-v1"] = JSON.stringify(discounts);
    const r = mapBackup(file);
    expect(r.data.productRecipe.some((l) => l.materialId === "khong-con")).toBe(false);
    expect(r.data.discountCustomers).toHaveLength(0);
    expect(r.warnings).toHaveLength(2);
  });

  it("concept: đọc danh sách, thời gian, liên kết với sản phẩm; concept không còn thì bỏ và báo; bản cũ chưa có concept thì rỗng", () => {
    expect(mapBackup(sample).data.concepts).toEqual([]);
    const file: BackupFile = JSON.parse(JSON.stringify(sample));
    file.data["bo-concepts-v1"] = JSON.stringify([
      { id: "noel", name: { vi: "Noel", en: "Christmas" }, color: "red", hidden: false, startsOn: "2026-12-01", endsOn: "2026-12-26" },
      { id: "tet", name: { vi: "Tết", en: "" }, hidden: true },
    ]);
    const products = JSON.parse(file.data["bo-products-v2"]);
    products[0].conceptIds = ["noel", "tet", "khong-con"];
    file.data["bo-products-v2"] = JSON.stringify(products);
    const r = mapBackup(file);
    expect(r.data.concepts).toEqual([
      { id: "noel", nameVi: "Noel", nameEn: "Christmas", color: "red", hidden: false, startsOn: new Date("2026-12-01T00:00:00.000Z"), endsOn: new Date("2026-12-26T00:00:00.000Z"), sortOrder: 0 },
      { id: "tet", nameVi: "Tết", nameEn: "Tết", color: "default", hidden: true, startsOn: null, endsOn: null, sortOrder: 1 },
    ]);
    expect(r.data.productConcepts).toEqual([
      { productId: products[0].id, conceptId: "noel" },
      { productId: products[0].id, conceptId: "tet" },
    ]);
    expect(r.warnings.some((w) => w.includes("khong-con"))).toBe(true);
  });

  it("giao diện web: giữ từng giao diện (đã đăng, nháp, thứ tự); bản cũ chưa có thì rỗng", () => {
    expect(mapBackup(sample).data.siteTheme).toEqual([]);
    const file: BackupFile = JSON.parse(JSON.stringify(sample));
    const published = { announcement: "Xin chào" };
    file.data["bo-site-themes-v1"] = JSON.stringify([
      { id: "default", name: "Mặc định", isDefault: true, published, draft: null, publishedAt: "2026-11-12T00:00:00.000Z" },
      { id: "noel", name: "Noel", isDefault: false, published: null, draft: { conceptIds: ["noel"] }, publishedAt: null },
    ]);
    const rows = mapBackup(file).data.siteTheme;
    expect(rows).toMatchObject([
      { id: "default", name: "Mặc định", published, draft: undefined, publishedAt: new Date("2026-11-12T00:00:00.000Z") },
      { id: "noel", name: "Noel", published: undefined, draft: { conceptIds: ["noel"] }, publishedAt: null },
    ]);
    expect(rows[0].createdAt < rows[1].createdAt).toBe(true);
  });
});
