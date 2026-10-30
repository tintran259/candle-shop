import { materialLevel, type StockLevel, type Usage } from "@/lib/inventory/stock";
import type { Material, MaterialCategory } from "@/lib/inventory/types";
import { fold } from "@/lib/search";

export type InventoryStatus = StockLevel | "all" | "unused";
export type InventorySort = "urgent" | "name" | "updated";

export type InventoryFilters = { q: string; category?: MaterialCategory; sort: InventorySort };
export const defaultInventoryFilters: InventoryFilters = { q: "", sort: "urgent" };

export const statusOrder: InventoryStatus[] = ["all", "out", "low", "ok", "untracked", "unused"];
export const statusLabels: Record<InventoryStatus, string> = {
  all: "Tất cả",
  out: "Hết hàng",
  low: "Sắp hết",
  ok: "Còn hàng",
  untracked: "Không theo dõi",
  unused: "Chưa dùng trên web",
};

export const sortOptions: { value: InventorySort; label: string }[] = [
  { value: "urgent", label: "Cần nhập trước" },
  { value: "name", label: "Tên A–Z" },
  { value: "updated", label: "Mới cập nhật" },
];

// Mức gấp: hết hàng → sắp hết (tồn so với ngưỡng thấp nhất trước) → còn → không theo dõi
const urgency = (m: Material) => {
  const level = materialLevel(m);
  if (level === "out") return -1;
  if (level === "untracked") return 99;
  return m.stock / Math.max(1, m.lowStock);
};

export const matchStatus = (m: Material, status: InventoryStatus, usage: Map<string, Usage[]>) =>
  status === "all" || (status === "unused" ? !usage.has(m.id) : materialLevel(m) === status);

export function applyInventoryFilters(list: Material[], status: InventoryStatus, f: InventoryFilters, usage: Map<string, Usage[]>) {
  const q = fold(f.q.trim());
  return list
    .filter((m) => matchStatus(m, status, usage))
    .filter((m) => !f.category || m.category === f.category)
    .filter((m) => !q || fold(m.name).includes(q) || fold(m.sku ?? "").includes(q) || fold(m.id).includes(q))
    .sort((a, b) => {
      if (f.sort === "name") return a.name.localeCompare(b.name, "vi");
      if (f.sort === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      return urgency(a) - urgency(b) || a.name.localeCompare(b.name, "vi");
    });
}
