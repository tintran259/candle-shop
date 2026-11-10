// Thủ công trên BE thật: sửa lựa chọn vào bản nháp (lưu ở BE, tải lại không mất) → bấm Lưu thay đổi → BE đưa lên bản web, xóa bản nháp
import { drawer, expect, test, type Api } from "./support/fixtures";

type Option = { id: string; unitPrice?: number; name: { vi: string } };
type Config = { steps: { id: string; options?: Option[] }[] };
type Craft = { saved: Config; draft: Config | null };

const beeswax = (c: Config | null) => c?.steps.find((s) => s.id === "wax")?.options?.find((o) => o.id === "beeswax");
const craft = (api: Api) => api.get<Craft>("/admin/craft");

test("Sửa giá Sáp ong: bản nháp lưu ở BE, bấm Lưu thì lên bản web", async ({ page, api }) => {
  const first = await craft(api);
  const old = beeswax(first.saved)!.unitPrice;
  expect(first.draft).toBeNull();

  await page.goto("/craft?step=wax");
  await page.getByRole("button", { name: "Sửa Sáp ong" }).click();
  const d = drawer(page);
  await d.getByLabel("Giá bán / 100 g").fill("55000");
  await d.getByRole("button", { name: "Áp dụng" }).click();
  await expect(d).toBeHidden();

  // Bản nháp đã sang BE, bản web chưa đổi
  await expect
    .poll(
      async () => {
        const p = beeswax((await craft(api)).draft)?.unitPrice;
        return p !== undefined && p !== old;
      },
      { timeout: 20_000 },
    )
    .toBe(true);
  const draftPrice = beeswax((await craft(api)).draft)!.unitPrice;
  expect(beeswax((await craft(api)).saved)!.unitPrice).toBe(old);

  // Tải lại trang: bản nháp đọc từ BE
  await page.reload();
  await expect(page.getByRole("button", { name: "Lưu thay đổi" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Lưu thay đổi" }).first().click();
  // Cấu hình còn lỗi thì hỏi trước khi lưu
  const anyway = page.getByRole("button", { name: "Vẫn lưu" });
  if (
    await anyway.waitFor({ timeout: 3000 }).then(
      () => true,
      () => false,
    )
  )
    await anyway.click();

  await expect.poll(async () => (await craft(api)).draft, { timeout: 20_000 }).toBeNull();
  expect(draftPrice).toBe(55_000);
  expect(beeswax((await craft(api)).saved)!.unitPrice).toBe(55_000);
  await expect(page.getByRole("button", { name: "Lưu thay đổi" })).toHaveCount(0);
});
