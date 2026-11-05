import { useMemo } from "react";
import { mockInventory } from "@/lib/inventory/mock";
import { averageCost, unitPrice } from "@/lib/costs";
import { unitLabel } from "@/lib/craft/groups";
import { batchNeeds } from "@/lib/inventory/production";
import type { Inventory, Material, StockMovement } from "@/lib/inventory/types";
import { guessJar, type ManualMovement } from "@/lib/inventory/stock";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE: GET/POST/PATCH /api/admin/inventory,
// POST /api/admin/inventory/:id/movements (xem docs/inventory.md).
// v2: hũ & nắp tách mã theo từng dung tích, tinh dầu tính theo ml
// Giá nhập mẫu theo id, dùng điền cho bản lưu trước khi có giá nhập
const mockCost = new Map(mockInventory.materials.map((m) => [m.id, m.unitCost]));
const store = createLocalStore<Inventory>("bo-inventory-v2", mockInventory, (inv) => ({
  ...inv,
  materials: inv.materials.map((m) => {
    // Bản lưu cũ: màu nhuộm tính theo cái, giờ tính theo ml, giữ nguyên con số
    const unit = m.category === "dye" && m.unit === "pcs" ? "ml" : m.unit;
    // Bản lưu trước khi có giá nhập: lấy giá mẫu của nguyên liệu cùng id
    const cost = "unitCost" in m ? {} : { unitCost: mockCost.get(m.id) };
    // Bản lưu trước khi hũ có loại hũ, dung tích: đoán theo tên "Hũ gốm trụ 150ml"
    const jar = m.category === "vessel" && !("capacity" in m) ? guessJar(m.name) : {};
    return { ...m, unit, ...cost, ...jar };
  }),
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
// riêng tồn ban đầu khi tạo mới được ghi thành phiếu "Nhập thêm"; có openingTotal (tiền mua số tồn đó) thì chia ra giá nhập ban đầu
const saveMaterial = (material: Omit<Material, "updatedAt">, openingTotal?: number) =>
  update((inv) => {
    const next = { ...material, updatedAt: now() };
    if (inv.materials.some((m) => m.id === next.id)) return { ...inv, materials: inv.materials.map((m) => (m.id === next.id ? next : m)) };
    const tracked = next.tracked && next.stock > 0;
    const total = tracked && openingTotal !== undefined && openingTotal >= 0 ? Math.round(openingTotal) : undefined;
    const cost = total !== undefined ? unitPrice(total, next.stock) : undefined;
    const created = cost === undefined ? next : { ...next, unitCost: cost };
    const opening = tracked
      ? [{ id: movementId(), materialId: next.id, type: "in" as const, change: next.stock, after: next.stock, note: "Tồn ban đầu", totalCost: total, unitCost: cost, by: STAFF, at: next.updatedAt }]
      : [];
    return { materials: [...inv.materials, created], movements: [...opening, ...inv.movements].slice(0, MAX_MOVEMENTS) };
  });

// Tạo nhiều nguyên liệu một lần (trang Thủ công gọi khi bấm Lưu) — mỗi cái có phiếu "Tồn ban đầu" như tạo tay
export const createMaterials = (list: Omit<Material, "updatedAt">[]) => {
  for (const m of list) if (!store.get().materials.some((x) => x.id === m.id)) saveMaterial(m);
};

const removeMaterial = (id: string) =>
  update((inv) => ({ materials: inv.materials.filter((m) => m.id !== id), movements: inv.movements.filter((mv) => mv.materialId !== id) }));

// in: + amount; out: − amount; adjust: đặt lại số thực tế = amount (kiểm kê).
// lotTotal: tổng tiền mua lô nhập — chia cho lượng nhập ra giá mỗi đơn vị, tính lại giá nhập bình quân
const move = (materialId: string, type: ManualMovement, amount: number, note?: string, lotTotal?: number) =>
  update((inv) => {
    const m = inv.materials.find((x) => x.id === materialId);
    if (!m) return inv;
    const after = Math.max(0, Math.round(type === "adjust" ? amount : type === "in" ? m.stock + amount : m.stock - amount));
    const change = after - m.stock;
    if (!change && type !== "adjust") return inv;
    const total = type === "in" && lotTotal !== undefined && lotTotal >= 0 ? Math.round(lotTotal) : undefined;
    const cost = total !== undefined ? unitPrice(total, change) : undefined;
    const movement = { id: movementId(), materialId, type, change, after, note: note?.trim() || undefined, totalCost: total, unitCost: cost, by: STAFF, at: now() };
    const nextCost = cost === undefined ? m.unitCost : averageCost(m.stock, m.unitCost, change, cost);
    return {
      materials: inv.materials.map((x) => (x.id === materialId ? { ...x, stock: after, unitCost: nextCost, updatedAt: movement.at } : x)),
      movements: [movement, ...inv.movements].slice(0, MAX_MOVEMENTS),
    };
  });

// Sửa tay giá nhập bình quân (nhập nhầm tiền lô, nguyên liệu chưa có giá) — ghi một dòng lịch sử, không đổi số tồn
const setCost = (materialId: string, unitCost: number) =>
  update((inv) => {
    const m = inv.materials.find((x) => x.id === materialId);
    if (!m || m.unitCost === unitCost) return inv;
    const movement = { id: movementId(), materialId, type: "cost" as const, change: 0, after: m.stock, unitCost, previousCost: m.unitCost, by: STAFF, at: now() };
    return {
      materials: inv.materials.map((x) => (x.id === materialId ? { ...x, unitCost, updatedAt: movement.at } : x)),
      movements: [movement, ...inv.movements].slice(0, MAX_MOVEMENTS),
    };
  });

// Sản xuất một mẻ: trừ từng nguyên liệu theo định mức × số lượng, cộng thành phẩm — các phiếu chung một mã mẻ.
// total: tổng chi phí mẻ, chia ra giá mỗi đơn vị rồi gộp vào giá bình quân của thành phẩm. Nơi gọi đã kiểm tra đủ tồn
const produce = (materialId: string, count: number, total: number, note?: string) =>
  update((inv) => {
    const made = inv.materials.find((x) => x.id === materialId);
    if (!made?.recipe?.length || count <= 0) return inv;
    const at = now();
    const batch = `SX-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const needs = batchNeeds(made.recipe, count);
    const uses = inv.materials.flatMap((m) => {
      const need = needs.get(m.id);
      return need && m.tracked
        ? [{ id: movementId(), materialId: m.id, type: "make" as const, change: -need, after: m.stock - need, note: `Làm ${made.name} · ${count} ${unitLabel[made.unit]}`, batch, by: STAFF, at }]
        : [];
    });
    const lotTotal = Math.max(0, Math.round(total));
    const price = unitPrice(lotTotal, count);
    const output = { id: movementId(), materialId, type: "make" as const, change: count, after: made.stock + count, note: note?.trim() || undefined, batch, totalCost: lotTotal, unitCost: price, by: STAFF, at };
    const next = record(inv, [output, ...uses]);
    const unitCost = price === undefined ? made.unitCost : averageCost(made.stock, made.unitCost, count, price);
    return { ...next, materials: next.materials.map((m) => (m.id === materialId ? { ...m, unitCost } : m)) };
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
    () => ({ materials: data.materials, movements: data.movements, loading, saveMaterial, removeMaterial, move, setCost, produce, reset }),
    [data, loading],
  );
}

export type InventoryApi = ReturnType<typeof useInventory>;
