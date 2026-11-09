// Chuyển bản ghi DB sang đúng dạng Material / StockMovement của BO (bo/src/lib/inventory/types.ts)
import { randomBytes } from 'node:crypto';
import type { Material, MaterialRecipeLine, StockMovement } from '../generated/prisma/client.js';

export const withRecipe = { recipe: { orderBy: { sortOrder: 'asc' } } } as const;
export type MaterialRow = Material & { recipe: MaterialRecipeLine[] };

const opt = <T>(v: T | null) => v ?? undefined;

export const materialDto = (m: MaterialRow) => ({
  id: m.id,
  name: m.name,
  sku: opt(m.sku),
  category: m.category,
  unit: m.unit,
  tracked: m.tracked,
  stock: m.stock,
  lowStock: m.lowStock,
  unitCost: opt(m.unitCost),
  jarType: opt(m.jarType),
  capacity: opt(m.capacity),
  ...(m.recipe.length && { recipe: m.recipe.map((r) => ({ materialId: r.componentId, quantity: r.quantity })) }),
  swatch: opt(m.swatch),
  note: opt(m.note),
  updatedAt: m.updatedAt.toISOString(),
});

export const movementDto = (mv: StockMovement) => ({
  id: mv.id,
  materialId: mv.materialId,
  type: mv.type,
  change: mv.change,
  after: mv.after,
  note: opt(mv.note),
  orderCode: opt(mv.orderCode),
  totalCost: opt(mv.totalCost),
  unitCost: opt(mv.unitCost),
  previousCost: opt(mv.previousCost),
  batch: opt(mv.batch),
  by: mv.by,
  at: mv.at.toISOString(),
});

// Id phiếu: thêm bộ đếm vì một thao tác ghi nhiều phiếu trong cùng một mili giây, thêm số ngẫu nhiên phòng nhiều tiến trình
let seq = 0;
export const movementId = () => `mv-${Date.now().toString(36)}-${(seq++ % 1296).toString(36)}${randomBytes(2).toString('hex')}`;
export const batchId = () => `SX-${Date.now().toString(36).slice(-5).toUpperCase()}`;
