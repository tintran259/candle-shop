import { useMemo } from "react";
import { mockInventory } from "@/lib/inventory/mock";
import type { Inventory, Material, MovementType, StockMovement } from "@/lib/inventory/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE: GET/POST/PATCH /api/admin/inventory,
// POST /api/admin/inventory/:id/movements (xem docs/inventory.md).
// v2: hũ & nắp tách mã theo từng dung tích, tinh dầu tính theo ml
const store = createLocalStore<Inventory>("bo-inventory-v2", mockInventory, (inv) => ({
  ...inv,
  // Bản lưu cũ: màu nhuộm tính theo cái, giờ tính theo ml, giữ nguyên con số
  materials: inv.materials.map((m) => (m.category === "dye" && m.unit === "pcs" ? { ...m, unit: "ml" } : m)),
}));

const STAFF = "Admin 2510";
const now = () => new Date().toISOString();
// Giữ tối đa chừng này dòng lịch sử trên trình duyệt
const MAX_MOVEMENTS = 500;

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu giữa các lần render
const update = (fn: (inv: Inventory) => Inventory) => store.set(fn(store.get()));

// Id phiếu: thêm bộ đếm vì tạo nhiều nguyên liệu cùng lúc (mã hũ từng cỡ) rơi vào cùng một mili giây
let seq = 0;
const movementId = () => `mv-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// Thêm mới hoặc thay nguyên liệu cùng id. Số tồn chỉ đổi qua move() để luôn có lịch sử —
// riêng tồn ban đầu khi tạo mới được ghi thành phiếu "Nhập thêm"
const saveMaterial = (material: Omit<Material, "updatedAt">, previousId?: string) =>
  update((inv) => {
    const key = previousId ?? material.id;
    const next = { ...material, updatedAt: now() };
    const exists = inv.materials.some((m) => m.id === key);
    if (exists) return { ...inv, materials: inv.materials.map((m) => (m.id === key ? next : m)) };
    const opening =
      next.tracked && next.stock > 0
        ? [{ id: movementId(), materialId: next.id, type: "in" as const, change: next.stock, after: next.stock, note: "Tồn ban đầu", by: STAFF, at: next.updatedAt }]
        : [];
    return { materials: [...inv.materials, next], movements: [...opening, ...inv.movements].slice(0, MAX_MOVEMENTS) };
  });

// Tạo nhiều nguyên liệu một lần (trang Thủ công gọi khi bấm Lưu) — mỗi cái có phiếu "Tồn ban đầu" như tạo tay
export const createMaterials = (list: Omit<Material, "updatedAt">[]) => {
  for (const m of list) if (!store.get().materials.some((x) => x.id === m.id)) saveMaterial(m);
};

const removeMaterial = (id: string) =>
  update((inv) => ({ materials: inv.materials.filter((m) => m.id !== id), movements: inv.movements.filter((mv) => mv.materialId !== id) }));

// in: + amount; out: − amount; adjust: đặt lại số thực tế = amount (kiểm kê)
const move = (materialId: string, type: Exclude<MovementType, "order">, amount: number, note?: string) =>
  update((inv) => {
    const m = inv.materials.find((x) => x.id === materialId);
    if (!m) return inv;
    const after = Math.max(0, Math.round(type === "adjust" ? amount : type === "in" ? m.stock + amount : m.stock - amount));
    const change = after - m.stock;
    if (!change && type !== "adjust") return inv;
    const movement = { id: movementId(), materialId, type, change, after, note: note?.trim() || undefined, by: STAFF, at: now() };
    return {
      materials: inv.materials.map((x) => (x.id === materialId ? { ...x, stock: after, updatedAt: movement.at } : x)),
      movements: [movement, ...inv.movements].slice(0, MAX_MOVEMENTS),
    };
  });

// Ghi nhiều phiếu một lần; số tồn mới lấy từ after của từng phiếu
const record = (inv: Inventory, list: StockMovement[]): Inventory => ({
  materials: inv.materials.map((m) => {
    const mv = list.find((x) => x.materialId === m.id);
    return mv ? { ...m, stock: mv.after, updatedAt: mv.at } : m;
  }),
  movements: [...list, ...inv.movements].slice(0, MAX_MOVEMENTS),
});

// Bắt đầu làm: mỗi nguyên liệu một phiếu "Theo đơn hàng". Nơi gọi đã kiểm tra đủ tồn
export const consumeOrder = (orderCode: string, needs: Map<string, number>) =>
  update((inv) =>
    record(
      inv,
      inv.materials.flatMap((m) => {
        const need = needs.get(m.id);
        return need ? [{ id: movementId(), materialId: m.id, type: "order" as const, change: -need, after: m.stock - need, note: `Đơn ${orderCode}`, orderCode, by: STAFF, at: now() }] : [];
      }),
    ),
  );

// Hủy đơn chưa làm: hoàn đúng lượng đã ghi trong phiếu của đơn, không tính lại từ cấu hình. Trả về số nguyên liệu được hoàn
export const restoreOrder = (orderCode: string) => {
  const inv = store.get();
  const used = new Map<string, number>();
  for (const mv of inv.movements) if (mv.orderCode === orderCode) used.set(mv.materialId, (used.get(mv.materialId) ?? 0) - mv.change);
  const back = inv.materials.flatMap((m) => {
    const amount = used.get(m.id) ?? 0;
    return amount > 0 ? [{ id: movementId(), materialId: m.id, type: "in" as const, change: amount, after: m.stock + amount, note: "Hoàn kho do hủy đơn", orderCode, by: STAFF, at: now() }] : [];
  });
  if (back.length) store.set(record(inv, back));
  return back.length;
};

const reset = () => store.set(null);

export function useInventory() {
  const { data, loading } = useLocalStore(store);
  return useMemo(
    () => ({ materials: data.materials, movements: data.movements, loading, saveMaterial, removeMaterial, move, reset }),
    [data, loading],
  );
}

export type InventoryApi = ReturnType<typeof useInventory>;
