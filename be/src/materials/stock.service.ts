// Phiếu kho: nhập / xuất / kiểm kê, sửa giá nhập, sản xuất theo mẻ. Giống bo/src/hooks/use-inventory.ts.
// Không sửa, không xóa phiếu — ghi sai thì ghi phiếu ngược lại (docs/pages/inventory.md#phiếu-kho)
import { BadRequestException, Injectable } from '@nestjs/common';
import { averageCost, batchNeeds, unitPrice } from '../common/costs.js';
import { fold } from '../common/text.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CostDto, MovementDto, MovementQuery, ProduceDto } from './materials.dto.js';
import { batchId, materialDto, movementDto, movementId, withRecipe } from './materials.map.js';
import { MaterialsService } from './materials.service.js';

const UNIT = { g: 'g', ml: 'ml', pcs: 'cái' } as const;
const num = (n: number) => n.toLocaleString('vi-VN');
// Ngày lọc tính theo giờ Việt Nam
const dayStart = (d: string) => new Date(`${d}T00:00:00+07:00`);
const dayEnd = (d: string) => new Date(`${d}T23:59:59.999+07:00`);

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materials: MaterialsService,
  ) {}

  // Lịch sử phiếu, mới nhất trước. q: tìm theo tên nguyên liệu, ghi chú, mã đơn, mã mẻ (không dấu)
  async movements(f: MovementQuery) {
    const where: Prisma.StockMovementWhereInput = {
      ...(f.type && { type: f.type }),
      ...(f.materialId && { materialId: f.materialId }),
      ...((f.from || f.to) && { at: { ...(f.from && { gte: dayStart(f.from) }), ...(f.to && { lte: dayEnd(f.to) }) } }),
    };
    const limit = f.limit ?? 500;
    const q = fold(f.q ?? '');
    const rows = await this.prisma.stockMovement.findMany({ where, orderBy: [{ at: 'desc' }, { id: 'desc' }], include: { material: { select: { name: true } } }, ...(!q && { take: limit }) });
    const hit = (s?: string | null) => !!s && fold(s).includes(q);
    return rows
      .filter((mv) => !q || hit(mv.material.name) || hit(mv.note) || hit(mv.orderCode) || hit(mv.batch))
      .slice(0, limit)
      .map(movementDto);
  }

  // in: + amount, lotTotal (tổng tiền lô) bắt buộc → giá lô, tính lại giá bình quân. out: − amount. adjust: đặt lại = amount
  move(id: string, dto: MovementDto, by: string) {
    return this.prisma.$transaction(async (tx) => {
      const m = await this.materials.find(tx, id);
      if (!m.tracked) throw new BadRequestException('Nguyên liệu không theo dõi tồn — không ghi phiếu kho.');
      if (dto.type !== 'adjust' && !dto.amount) throw new BadRequestException('Nhập số lượng lớn hơn 0.');
      if (dto.type === 'out' && dto.amount > m.stock) throw new BadRequestException(`Không xuất quá số đang có (còn ${num(m.stock)} ${UNIT[m.unit]}).`);
      if (dto.type === 'in' && dto.lotTotal === undefined) throw new BadRequestException('Nhập tổng tiền đã trả cho lô, hoặc 0 nếu không mất tiền.');
      const after = Math.max(0, Math.round(dto.type === 'adjust' ? dto.amount : dto.type === 'in' ? m.stock + dto.amount : m.stock - dto.amount));
      const change = after - m.stock;
      if (!change && dto.type !== 'adjust') throw new BadRequestException('Số tồn không đổi — nhập số lượng lớn hơn.');
      const total = dto.type === 'in' ? dto.lotTotal : undefined;
      const price = total !== undefined ? unitPrice(total, change) : undefined;
      const at = new Date();
      const movement = await tx.stockMovement.create({
        data: { id: movementId(), materialId: id, type: dto.type, change, after, note: dto.note?.trim() || null, totalCost: total ?? null, unitCost: price ?? null, by, at },
      });
      const unitCost = price === undefined ? m.unitCost : averageCost(m.stock, m.unitCost, change, price);
      const material = await tx.material.update({ where: { id }, data: { stock: after, unitCost }, include: withRecipe });
      return { material: materialDto(material), movement: movementDto(movement) };
    });
  }

  // Sửa tay giá nhập bình quân — ghi phiếu "Sửa giá nhập" (giá mới, giá trước), không đổi số tồn. Giá không đổi thì không ghi
  setCost(id: string, dto: CostDto, by: string) {
    return this.prisma.$transaction(async (tx) => {
      const m = await this.materials.find(tx, id);
      const unitCost = Math.round(dto.unitCost * 100) / 100;
      if (m.unitCost === unitCost) return { material: materialDto(m), movement: null };
      const movement = await tx.stockMovement.create({
        data: { id: movementId(), materialId: id, type: 'cost', change: 0, after: m.stock, unitCost, previousCost: m.unitCost, by, at: new Date() },
      });
      const material = await tx.material.update({ where: { id }, data: { unitCost }, include: withRecipe });
      return { material: materialDto(material), movement: movementDto(movement) };
    });
  }

  // Một mẻ: trừ từng nguyên liệu theo định mức × số lượng (mỗi nguyên liệu một phiếu), cộng thành phẩm, chung một mã mẻ.
  // Giá mẻ: tự nhập (total) hoặc theo giá nhập bình quân của nguyên liệu; chia ra giá mỗi đơn vị rồi gộp vào giá bình quân thành phẩm
  produce(id: string, dto: ProduceDto, by: string) {
    return this.prisma.$transaction(async (tx) => {
      const made = await this.materials.find(tx, id);
      if (!made.recipe.length) throw new BadRequestException('Nguyên liệu này không có công thức sản xuất.');
      const needs = batchNeeds(
        made.recipe.map((r) => ({ materialId: r.componentId, quantity: r.quantity })),
        dto.count,
      );
      const parts = await tx.material.findMany({ where: { id: { in: [...needs.keys()] } } });
      const short = parts.filter((p) => p.tracked && needs.get(p.id)! > p.stock);
      if (short.length) throw new BadRequestException(`Không đủ ${short.map((p) => `${p.name} (cần ${num(needs.get(p.id)!)} ${UNIT[p.unit]}, còn ${num(p.stock)})`).join(', ')}.`);
      const noCost = parts.filter((p) => p.unitCost === null);
      if (dto.total === undefined && noCost.length) throw new BadRequestException(`${noCost.map((p) => p.name).join(', ')} chưa có giá nhập — đặt giá trong Kho, hoặc tự nhập tổng chi phí mẻ.`);
      const total = dto.total ?? Math.round(parts.reduce((s, p) => s + needs.get(p.id)! * (p.unitCost ?? 0), 0));
      const at = new Date();
      const batch = batchId();
      const note = `Làm ${made.name} · ${dto.count} ${UNIT[made.unit]}`;
      const uses = parts
        .filter((p) => p.tracked)
        .map((p) => ({ id: movementId(), materialId: p.id, type: 'make' as const, change: -needs.get(p.id)!, after: p.stock - needs.get(p.id)!, note, batch, by, at }));
      const price = unitPrice(total, dto.count);
      const output = {
        id: movementId(),
        materialId: id,
        type: 'make' as const,
        change: dto.count,
        after: made.stock + dto.count,
        note: dto.note?.trim() || null,
        batch,
        totalCost: total,
        unitCost: price ?? null,
        by,
        at,
      };
      await tx.stockMovement.createMany({ data: [output, ...uses] });
      for (const u of uses) await tx.material.update({ where: { id: u.materialId }, data: { stock: u.after } });
      const unitCost = price === undefined ? made.unitCost : averageCost(made.stock, made.unitCost, dto.count, price);
      const material = await tx.material.update({ where: { id }, data: { stock: output.after, unitCost }, include: withRecipe });
      const movements = await tx.stockMovement.findMany({ where: { batch }, orderBy: { change: 'desc' } });
      return { material: materialDto(material), batch, movements: movements.map(movementDto) };
    });
  }
}
