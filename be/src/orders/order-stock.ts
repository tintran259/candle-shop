// Nguyên liệu của đơn (docs/pages/inventory.md#giữ-nguyên-liệu): đơn Đã thanh toán giữ nguyên liệu (không đổi tồn, đơn khác
// không dùng được), Bắt đầu làm thì trừ Kho (phiếu "Theo đơn hàng"), hủy đơn chưa làm thì hoàn đúng lượng đã trừ
import { ConflictException } from '@nestjs/common';
import type { Material, Prisma } from '../generated/prisma/client.js';
import { movementId } from '../materials/materials.map.js';

type Tx = Prisma.TransactionClient;
type Recipe = { materialId: string; quantity: number }[];
export type NeedLine = { productId?: string | null; recipe?: unknown; quantity: number };
export type Shortage = { materialId: string; name: string; need: number; available: number };

const UNIT = { g: 'g', ml: 'ml', pcs: 'cái' } as const;
const num = (n: number) => n.toLocaleString('vi-VN');

// Tổng nguyên liệu: dòng có công thức chụp trên đơn thì theo đó, nến có sẵn theo công thức sản phẩm. Chỉ tính nguyên liệu theo dõi tồn
export async function linesNeeds(tx: Tx, lines: NeedLine[]) {
  const productIds = [...new Set(lines.filter((l) => !l.recipe && l.productId).map((l) => l.productId!))];
  const products = await tx.productRecipeLine.findMany({ where: { productId: { in: productIds } } });
  const needs = new Map<string, number>();
  for (const l of lines) {
    const recipe: Recipe = Array.isArray(l.recipe) ? (l.recipe as Recipe) : products.filter((r) => r.productId === l.productId);
    for (const r of recipe) if (r.quantity > 0) needs.set(r.materialId, (needs.get(r.materialId) ?? 0) + r.quantity * l.quantity);
  }
  const materials = await tx.material.findMany({ where: { id: { in: [...needs.keys()] }, tracked: true } });
  for (const id of needs.keys()) if (!materials.some((m) => m.id === id)) needs.delete(id);
  return { needs, materials };
}

// Đang giữ cho các đơn Đã thanh toán (trừ đơn đang sửa)
export async function heldNeeds(tx: Tx, excludeId?: string) {
  const items = await tx.orderItem.findMany({ where: { order: { status: 'paid', ...(excludeId && { id: { not: excludeId } }) } }, select: { productId: true, recipe: true, quantity: true } });
  return (await linesNeeds(tx, items)).needs;
}

const shortages = (needs: Map<string, number>, materials: Material[], held?: Map<string, number>): Shortage[] =>
  materials.flatMap((m) => {
    const need = needs.get(m.id) ?? 0;
    const available = m.stock - (held?.get(m.id) ?? 0);
    return need > available ? [{ materialId: m.id, name: m.name, need, available }] : [];
  });

const shortText = (list: Shortage[], materials: Material[]) =>
  list.map((s) => `${s.name} (cần ${num(s.need)} ${UNIT[materials.find((m) => m.id === s.materialId)!.unit]}, còn ${num(s.available)})`).join(', ');

// Tạo / sửa đơn: đủ nguyên liệu trên phần còn dùng được (tồn − đang giữ)
export async function assertAvailable(tx: Tx, lines: NeedLine[], excludeId?: string) {
  const { needs, materials } = await linesNeeds(tx, lines);
  if (!needs.size) return;
  const short = shortages(needs, materials, await heldNeeds(tx, excludeId));
  if (short.length) throw new ConflictException({ message: `Kho không đủ ${shortText(short, materials)} — giảm số lượng hoặc đổi cấu hình.`, shortages: short });
}

// Bắt đầu làm: đủ tồn thực tế thì trừ, mỗi nguyên liệu một phiếu. Trả giá vốn nguyên liệu chốt theo giá nhập lúc này
export async function consumeOrder(tx: Tx, order: { id: string; code: string }, by: string) {
  const items = await tx.orderItem.findMany({ where: { orderId: order.id }, select: { productId: true, recipe: true, quantity: true } });
  const { needs, materials } = await linesNeeds(tx, items);
  const short = shortages(needs, materials);
  if (short.length) throw new ConflictException({ message: `Kho không đủ để bắt đầu làm: ${shortText(short, materials)}.`, shortages: short });
  const at = new Date();
  for (const m of materials) {
    const need = needs.get(m.id)!;
    await tx.stockMovement.create({ data: { id: movementId(), materialId: m.id, type: 'order', change: -need, after: m.stock - need, note: `Đơn ${order.code}`, orderCode: order.code, by, at } });
    await tx.material.update({ where: { id: m.id }, data: { stock: m.stock - need } });
  }
  return Math.round(materials.reduce((s, m) => s + needs.get(m.id)! * (m.unitCost ?? 0), 0));
}

// Hủy đơn chưa làm: hoàn đúng lượng đã ghi trong phiếu của đơn, không tính lại từ công thức. Trả số nguyên liệu được hoàn
export async function restoreOrder(tx: Tx, code: string, by: string) {
  const moves = await tx.stockMovement.groupBy({ by: ['materialId'], where: { orderCode: code }, _sum: { change: true } });
  let count = 0;
  for (const mv of moves) {
    const amount = -(mv._sum.change ?? 0);
    if (amount <= 0) continue;
    const m = await tx.material.findUnique({ where: { id: mv.materialId } });
    if (!m) continue;
    await tx.stockMovement.create({
      data: { id: movementId(), materialId: m.id, type: 'in', change: amount, after: m.stock + amount, note: 'Hoàn kho do hủy đơn', orderCode: code, by, at: new Date() },
    });
    await tx.material.update({ where: { id: m.id }, data: { stock: m.stock + amount } });
    count++;
  }
  return count;
}

// Đơn đã có phiếu trừ theo đơn chưa
export const hasConsumed = async (tx: Tx, code: string) => (await tx.stockMovement.count({ where: { orderCode: code, type: 'order' } })) > 0;
