import { useMemo } from "react";
import { mockInventory } from "@/lib/inventory/mock";
import { averageCost, unitPrice } from "@/lib/costs";
import { unitLabel } from "@/lib/craft/groups";
import { batchNeeds } from "@/lib/inventory/production";
import type { Inventory, Material, StockMovement } from "@/lib/inventory/types";
import { guessJar, type ManualMovement } from "@/lib/inventory/stock";
import { api } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Kho nguyên liệu và phiếu kho: /api/admin/materials, /api/admin/stock-movements (docs/api.md#kho-nguyên-liệu).
// Mỗi thao tác đổi ngay trên giao diện (tính như cũ), gọi BE rồi tải lại kho — BE là nơi tính số tồn, giá bình quân thật.
// Lưu trên trình duyệt (chế độ local): v2 — hũ & nắp tách mã theo từng dung tích, tinh dầu tính theo ml
// Giá nhập mẫu theo id, dùng điền cho bản lưu trước khi có giá nhập
const mockCost = new Map(mockInventory.materials.map((m) => [m.id, m.unitCost]));
const loadRemote = async (): Promise<Inventory> => {
  const [materials, movements] = await Promise.all([api<Material[]>("GET", "/admin/materials"), api<StockMovement[]>("GET", "/admin/stock-movements?limit=500")]);
  return { materials, movements };
};
const store = createLocalStore<Inventory>(
  "bo-inventory-v2",
  REMOTE ? { materials: [], movements: [] } : mockInventory,
  (inv) => ({
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
  }),
  loadRemote,
);

const STAFF = "Admin 2510";
const now = () => new Date().toISOString();
// Giữ tối đa chừng này dòng lịch sử trên trình duyệt
const MAX_MOVEMENTS = 500;

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu giữa các lần render.
// request: gọi BE (chế độ BE), xong thì tải lại kho
const update = (fn: (inv: Inventory) => Inventory, request?: () => Promise<unknown>) => store.sync(fn(store.get()), request && (async () => (await request(), "reload" as const)));

// Gửi BE: trường đã bỏ (undefined) gửi "" / null để BE xóa theo; giá nhập chỉ gửi khi không theo dõi tồn
const materialBody = (m: Omit<Material, "updatedAt">) => ({
  name: m.name,
  sku: m.sku ?? "",
  category: m.category,
  unit: m.unit,
  tracked: m.tracked,
  lowStock: m.lowStock,
  ...(!m.tracked && { unitCost: m.unitCost ?? null }),
  jarType: m.jarType ?? "",
  capacity: m.capacity ?? null,
  recipe: m.recipe ?? [],
  swatch: m.swatch ?? "",
  note: m.note ?? "",
});
const createBody = (m: Omit<Material, "updatedAt">, openingTotal?: number) => ({
  ...materialBody(m),
  id: m.id,
  stock: m.stock,
  ...(openingTotal !== undefined && m.tracked && m.stock > 0 && { openingTotal: Math.round(openingTotal) }),
});

// Id phiếu: thêm bộ đếm vì tạo nhiều nguyên liệu cùng lúc (mã hũ từng cỡ) rơi vào cùng một mili giây
let seq = 0;
const movementId = () => `mv-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// Thêm mới hoặc thay nguyên liệu cùng id. Số tồn chỉ đổi qua move() để luôn có lịch sử —
// riêng tồn ban đầu khi tạo mới được ghi thành phiếu "Nhập thêm"; có openingTotal (tiền mua số tồn đó) thì chia ra giá nhập ban đầu
const saveMaterial = (material: Omit<Material, "updatedAt">, openingTotal?: number) => {
  const exists = store.get().materials.some((m) => m.id === material.id);
  return update(
    (inv) => {
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
    },
    () => (exists ? api("PATCH", `/admin/materials/${material.id}`, materialBody(material)) : api("POST", "/admin/materials", createBody(material, openingTotal))),
  );
};

// Tạo nhiều nguyên liệu một lần (trang Thủ công gọi khi bấm Lưu) — mỗi cái có phiếu "Tồn ban đầu" như tạo tay
export const createMaterials = (list: (Omit<Material, "updatedAt"> & { openingTotal?: number })[]) => {
  const fresh = list.filter((m) => !store.get().materials.some((x) => x.id === m.id));
  if (store.online)
    return fresh.length
      ? update(
          (inv) => inv,
          () => api("POST", "/admin/materials/batch", { materials: fresh.map(({ openingTotal, ...m }) => createBody(m, openingTotal)) }),
        )
      : true;
  for (const { openingTotal, ...m } of fresh) saveMaterial(m, openingTotal);
  return true;
};

const removeMaterial = (id: string) =>
  update(
    (inv) => ({ materials: inv.materials.filter((m) => m.id !== id), movements: inv.movements.filter((mv) => mv.materialId !== id) }),
    () => api("DELETE", `/admin/materials/${id}`),
  );

// in: + amount; out: − amount; adjust: đặt lại số thực tế = amount (kiểm kê).
// lotTotal: tổng tiền mua lô nhập — chia cho lượng nhập ra giá mỗi đơn vị, tính lại giá nhập bình quân
const move = (materialId: string, type: ManualMovement, amount: number, note?: string, lotTotal?: number) =>
  update(
    (inv) => {
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
    },
    () =>
      api("POST", `/admin/materials/${materialId}/movements`, { type, amount, note: note?.trim() || undefined, ...(type === "in" && lotTotal !== undefined && { lotTotal: Math.round(lotTotal) }) }),
  );

// Sửa tay giá nhập bình quân (nhập nhầm tiền lô, nguyên liệu chưa có giá) — ghi một dòng lịch sử, không đổi số tồn
const setCost = (materialId: string, unitCost: number) =>
  update(
    (inv) => {
      const m = inv.materials.find((x) => x.id === materialId);
      if (!m || m.unitCost === unitCost) return inv;
      const movement = { id: movementId(), materialId, type: "cost" as const, change: 0, after: m.stock, unitCost, previousCost: m.unitCost, by: STAFF, at: now() };
      return {
        materials: inv.materials.map((x) => (x.id === materialId ? { ...x, unitCost, updatedAt: movement.at } : x)),
        movements: [movement, ...inv.movements].slice(0, MAX_MOVEMENTS),
      };
    },
    () => api("PUT", `/admin/materials/${materialId}/cost`, { unitCost }),
  );

// Sản xuất một mẻ: trừ từng nguyên liệu theo định mức × số lượng, cộng thành phẩm — các phiếu chung một mã mẻ.
// total: tổng chi phí mẻ, chia ra giá mỗi đơn vị rồi gộp vào giá bình quân của thành phẩm. Nơi gọi đã kiểm tra đủ tồn
const produce = (materialId: string, count: number, total: number, note?: string) =>
  update(
    (inv) => {
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
      const output = {
        id: movementId(),
        materialId,
        type: "make" as const,
        change: count,
        after: made.stock + count,
        note: note?.trim() || undefined,
        batch,
        totalCost: lotTotal,
        unitCost: price,
        by: STAFF,
        at,
      };
      const next = record(inv, [output, ...uses]);
      const unitCost = price === undefined ? made.unitCost : averageCost(made.stock, made.unitCost, count, price);
      return { ...next, materials: next.materials.map((m) => (m.id === materialId ? { ...m, unitCost } : m)) };
    },
    () => api("POST", `/admin/materials/${materialId}/produce`, { count, total: Math.max(0, Math.round(total)), note: note?.trim() || undefined }),
  );

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
// Số nguyên liệu đã trừ theo đơn (để báo số nguyên liệu được hoàn khi hủy — BE tự hoàn)
export const consumedCount = (code: string) =>
  new Set(
    store
      .get()
      .movements.filter((m) => m.orderCode === code && m.change < 0)
      .map((m) => m.materialId),
  ).size;
// Tải lại kho từ BE (vd sau khi Lưu cấu hình Thủ công tạo nguyên liệu mới, sau thao tác đơn hàng trừ / hoàn kho)
export const reloadInventory = () => store.reload();

export function useInventory() {
  const { data, loading } = useLocalStore(store);
  return useMemo(() => ({ materials: data.materials, movements: data.movements, loading, saveMaterial, removeMaterial, move, setCost, produce, reset }), [data, loading]);
}

export type InventoryApi = ReturnType<typeof useInventory>;
