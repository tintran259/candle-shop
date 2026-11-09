// Nguyên liệu trong Kho: tạo, sửa thông tin, xóa. Số tồn và giá nhập chỉ đổi qua phiếu (stock.service.ts),
// riêng tồn ban đầu khi tạo mới được ghi thành phiếu "Nhập thêm · Tồn ban đầu" (docs/pages/inventory.md)
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { unitPrice } from '../common/costs.js';
import { uniqueSlug } from '../common/text.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMaterialDto, RecipeLineDto, UpdateMaterialDto } from './materials.dto.js';
import { materialDto, movementId, withRecipe } from './materials.map.js';

type Tx = Prisma.TransactionClient;
const clean = (s?: string) => s?.trim() || null;

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.material.findMany({ include: withRecipe, orderBy: [{ category: 'asc' }, { name: 'asc' }] })).map(materialDto);
  }

  async get(id: string) {
    return materialDto(await this.find(this.prisma, id));
  }

  async find(tx: Tx, id: string) {
    const row = await tx.material.findUnique({ where: { id }, include: withRecipe });
    if (!row) throw new NotFoundException('Không tìm thấy nguyên liệu.');
    return row;
  }

  // Công thức sản xuất: nguyên liệu có thật, không trùng, không phải chính nó, không phải thứ đang được làm từ nó (chặn vòng)
  private async checkRecipe(tx: Tx, id: string, recipe: RecipeLineDto[]) {
    const ids = recipe.map((r) => r.materialId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Công thức có nguyên liệu bị trùng.');
    if (ids.includes(id)) throw new BadRequestException('Công thức không được dùng chính nguyên liệu này.');
    const all = await tx.material.findMany({ select: { id: true, name: true, recipe: { select: { componentId: true } } } });
    const byId = new Map(all.map((m) => [m.id, m]));
    const missing = ids.filter((x) => !byId.has(x));
    if (missing.length) throw new BadRequestException(`Không có nguyên liệu ${missing.join(', ')} trong Kho.`);
    const madeFrom = (from: string, seen = new Set<string>()): boolean => {
      if (seen.has(from)) return false;
      seen.add(from);
      return (byId.get(from)?.recipe ?? []).some((r) => r.componentId === id || madeFrom(r.componentId, seen));
    };
    const loop = ids.find((x) => madeFrom(x));
    if (loop) throw new BadRequestException(`${byId.get(loop)?.name} đang được làm từ nguyên liệu này — không dùng ngược lại được.`);
  }

  private jar(category: string, jarType?: string | null, capacity?: number | null) {
    if (category !== 'vessel') return { jarType: null, capacity: null };
    const type = clean(jarType ?? undefined);
    if (type && !capacity) throw new BadRequestException('Nhập dung tích cho hũ.');
    return { jarType: type, capacity: capacity ?? null };
  }

  private async createOne(tx: Tx, dto: CreateMaterialDto, by: string) {
    const recipe = dto.recipe ?? [];
    const made = recipe.length > 0;
    // Thành phẩm sản xuất luôn theo dõi tồn; số lượng ghi bằng phiếu Sản xuất
    const tracked = made || dto.tracked;
    const stock = tracked ? Math.max(0, Math.round(dto.stock ?? 0)) : 0;
    if (made && stock > 0) throw new BadRequestException('Thành phẩm sản xuất: ghi số lượng bằng phiếu Sản xuất, không nhập tồn ban đầu.');
    if (dto.openingTotal !== undefined && !stock) throw new BadRequestException('Nhập tồn ban đầu để chia ra giá mỗi đơn vị.');
    const taken = new Set((await tx.material.findMany({ select: { id: true } })).map((m) => m.id));
    if (dto.id && taken.has(dto.id)) throw new ConflictException('Mã nguyên liệu đã tồn tại.');
    const id = dto.id ?? uniqueSlug(dto.name, taken, 'material');
    if (made) await this.checkRecipe(tx, id, recipe);
    const opening = dto.openingTotal !== undefined ? unitPrice(dto.openingTotal, stock) : undefined;
    const now = new Date();
    await tx.material.create({
      data: {
        id,
        name: dto.name.trim(),
        sku: clean(dto.sku),
        category: dto.category,
        unit: dto.unit,
        tracked,
        stock,
        lowStock: Math.max(0, Math.round(dto.lowStock ?? 0)),
        // Theo dõi tồn: giá ban đầu từ tiền đã trả cho tồn ban đầu. Không theo dõi: nhập thẳng giá
        unitCost: tracked ? (opening ?? null) : (dto.unitCost ?? null),
        ...this.jar(dto.category, dto.jarType, dto.capacity),
        swatch: clean(dto.swatch),
        note: clean(dto.note),
        recipe: { create: recipe.map((r, i) => ({ componentId: r.materialId, quantity: r.quantity, sortOrder: i })) },
      },
    });
    if (stock > 0)
      await tx.stockMovement.create({
        data: { id: movementId(), materialId: id, type: 'in', change: stock, after: stock, note: 'Tồn ban đầu', totalCost: dto.openingTotal ?? null, unitCost: opening ?? null, by, at: now },
      });
    return materialDto(await this.find(tx, id));
  }

  create(dto: CreateMaterialDto, by: string) {
    return this.prisma.$transaction((tx) => this.createOne(tx, dto, by));
  }

  // Tạo nhiều nguyên liệu một lần (trang Thủ công bấm Lưu). Id đã có thì bỏ qua. Lỗi một cái thì không tạo cái nào
  createMany(list: CreateMaterialDto[], by: string) {
    return this.prisma.$transaction((tx) => this.createManyIn(tx, list, by));
  }

  // Dùng trong giao dịch của nơi gọi (Lưu cấu hình Thủ công)
  async createManyIn(tx: Tx, list: CreateMaterialDto[], by: string) {
    const out = [];
    for (const dto of list) {
      if (dto.id && (await tx.material.findUnique({ where: { id: dto.id } }))) continue;
      out.push(await this.createOne(tx, dto, by));
    }
    return out;
  }

  // Sửa thông tin và cài đặt — không đổi số tồn. Giá nhập chỉ sửa thẳng khi không theo dõi tồn
  update(id: string, dto: UpdateMaterialDto) {
    return this.prisma.$transaction(async (tx) => {
      const m = await this.find(tx, id);
      const recipe = dto.recipe ?? m.recipe.map((r) => ({ materialId: r.componentId, quantity: r.quantity }));
      const made = recipe.length > 0;
      const tracked = made || (dto.tracked ?? m.tracked);
      if (dto.tracked === false && made) throw new BadRequestException('Thành phẩm sản xuất luôn theo dõi tồn.');
      if (dto.unitCost !== undefined && tracked && dto.unitCost !== m.unitCost) throw new BadRequestException('Nguyên liệu theo dõi tồn: đổi giá bằng phiếu nhập hoặc Sửa giá.');
      if (dto.recipe) await this.checkRecipe(tx, id, dto.recipe);
      const category = dto.category ?? m.category;
      await tx.material.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.sku !== undefined && { sku: clean(dto.sku) }),
          category,
          ...(dto.unit !== undefined && { unit: dto.unit }),
          tracked,
          ...(dto.lowStock !== undefined && { lowStock: Math.max(0, Math.round(dto.lowStock)) }),
          ...(dto.unitCost !== undefined && !tracked && { unitCost: dto.unitCost }),
          ...this.jar(category, dto.jarType === undefined ? m.jarType : dto.jarType, dto.capacity === undefined ? m.capacity : dto.capacity),
          ...(dto.swatch !== undefined && { swatch: clean(dto.swatch) }),
          ...(dto.note !== undefined && { note: clean(dto.note) }),
          ...(dto.recipe && { recipe: { deleteMany: {}, create: dto.recipe.map((r, i) => ({ componentId: r.materialId, quantity: r.quantity, sortOrder: i })) } }),
        },
      });
      return materialDto(await this.find(tx, id));
    });
  }

  // Xóa cả lịch sử phiếu. Đang nằm trong công thức sản phẩm hoặc công thức sản xuất thì không xóa được
  async remove(id: string) {
    await this.find(this.prisma, id);
    const [products, made] = await Promise.all([
      this.prisma.product.findMany({ where: { recipe: { some: { materialId: id } } }, select: { name: true } }),
      this.prisma.material.findMany({ where: { recipe: { some: { componentId: id } } }, select: { name: true } }),
    ]);
    const users = [...made.map((m) => m.name), ...products.map((p) => p.name)];
    if (users.length) throw new ConflictException(`Đang dùng trong công thức của ${users.join(', ')} — bỏ khỏi công thức trước khi xóa.`);
    await this.prisma.material.delete({ where: { id } });
  }
}
