// Kho › Dùng trên web: lựa chọn đã gắn trong bản nháp Thủ công nhưng chưa Lưu thì ghi "Chưa lưu", nhắc bấm Lưu thay đổi
import { expect, test } from "./support/harness.mjs";

test("Hũ gắn trong bản nháp Thủ công, chưa lưu: bảng ghi Chưa lưu, chi tiết nhắc Lưu thay đổi; lưu rồi thì tính là dùng trên web", async ({ page, t }) => {
  void t;
  await page.goto("/craft");
  // Bản đã lưu: bước Hũ chưa có lựa chọn. Bản nháp: thêm Hũ gốm trụ 150ml (jar-ceramic-150-…)
  const id = await page.evaluate(() => {
    const inv = JSON.parse(localStorage.getItem("bo-inventory-v2") ?? "null");
    return inv?.materials?.find((m: { jarType?: string; capacity?: number }) => m.jarType === "Hũ gốm trụ" && m.capacity === 150)?.id ?? "jar-ceramic-150";
  });
  await page.evaluate((jarId) => {
    const name = (vi: string) => ({ vi, en: vi });
    const vessel = (options: unknown[]) => ({ id: "vessel", kind: "vessel", title: name("Hũ nến"), icon: "vessel", enabled: true, required: true, options });
    const ceramic = {
      id: "ceramic",
      name: name("Hũ gốm"),
      priceDelta: 500000,
      available: true,
      shape: "tumbler",
      jarType: "Hũ gốm trụ",
      lid: null,
      sizes: [{ id: jarId, ml: 150, grams: 120, priceDelta: 0, available: true, materialId: jarId }],
    };
    const config = (options: unknown[]) => ({ version: 1, currency: "VND", steps: [vessel(options)] });
    localStorage.setItem("bo-craft-builder-v5", JSON.stringify(config([])));
    localStorage.setItem("bo-craft-builder-v5-draft", JSON.stringify(config([ceramic])));
  }, id);

  await page.goto("/inventory");
  await page.getByLabel("Tìm nguyên liệu").fill("Hũ gốm trụ 150");
  const row = page.locator(".ant-table-row", { hasText: "Hũ gốm trụ 150ml" });
  await expect(row.getByText("Chưa lưu")).toBeVisible();

  await page.goto(`/inventory?material=${id}`);
  const drawer = page.locator(".ant-drawer-open").last();
  await expect(drawer).toContainText("Dùng trên web (0)");
  await expect(drawer).toContainText("Đã gắn 1 lựa chọn trong bản nháp Thủ công nhưng chưa lưu");
  await expect(drawer.getByRole("link", { name: /Hũ gốm 150ml/ })).toContainText("Chưa lưu");
  await expect(drawer.getByRole("link", { name: "Lưu thay đổi ở trang Thủ công" })).toHaveAttribute("href", "/craft");

  // Lưu ở Thủ công → bản đã lưu có hũ, Kho tính là dùng trên web
  await page.evaluate(() => {
    localStorage.setItem("bo-craft-builder-v5", localStorage.getItem("bo-craft-builder-v5-draft")!);
    localStorage.removeItem("bo-craft-builder-v5-draft");
  });
  await page.goto(`/inventory?material=${id}`);
  await expect(page.locator(".ant-drawer-open").last()).toContainText("Dùng trên web (1)");
  await expect(page.locator(".ant-drawer-open").last()).not.toContainText("Chưa lưu");
});
