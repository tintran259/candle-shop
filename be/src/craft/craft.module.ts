// Cấu hình Thủ công (docs/pages/craft.md, docs/craft-builder.md). Hai bản ghi: "saved" (web đang dùng) và "draft" (bản nháp
// trên trang Thủ công, kèm nguyên liệu tạo mới chờ vào Kho). Bấm Lưu: tạo nguyên liệu mới mà cấu hình còn dùng, ghi bản đã lưu, xóa nháp
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Injectable, Module, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import type { AuthedRequest } from '../auth/auth.guard.js';
import type { Prisma } from '../generated/prisma/client.js';
import { CreateMaterialDto } from '../materials/materials.dto.js';
import { MaterialsModule } from '../materials/materials.module.js';
import { MaterialsService } from '../materials/materials.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_CRAFT } from './default-config.js';
import { craftError, materialIds } from './validate.js';

class CraftDto {
  @IsObject() config: Record<string, unknown>;
  // Nguyên liệu tạo từ drawer lựa chọn, chỉ vào Kho khi bấm Lưu. Bắt buộc có id (cấu hình trỏ tới bằng id)
  @IsOptional() @ValidateNested({ each: true }) @Type(() => CreateMaterialDto) pendingMaterials?: CreateMaterialDto[];
}

const json = (v: unknown) => v as Prisma.InputJsonValue;

@Injectable()
export class CraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materials: MaterialsService,
  ) {}

  // saved: cấu hình web đang dùng (chưa lưu lần nào thì là cấu hình mẫu, isDefault). draft: bản nháp hoặc null
  async get() {
    const rows = await this.prisma.craftConfig.findMany();
    const saved = rows.find((r) => r.id === 'saved');
    const draft = rows.find((r) => r.id === 'draft');
    return {
      saved: saved ? { ...(saved.config as object), updatedAt: saved.updatedAt.toISOString() } : DEFAULT_CRAFT,
      isDefault: !saved,
      draft: draft ? { ...(draft.config as object), updatedAt: draft.updatedAt.toISOString() } : null,
      pendingMaterials: (draft?.pendingMaterials as unknown[] | null) ?? [],
    };
  }

  private check(dto: CraftDto) {
    const err = craftError(dto.config);
    if (err) throw new BadRequestException(err);
    if ((dto.pendingMaterials ?? []).some((m) => !m.id)) throw new BadRequestException('Nguyên liệu chờ tạo cần có id.');
    // updatedAt do máy chủ ghi
    return Object.fromEntries(Object.entries(dto.config).filter(([k]) => k !== 'updatedAt'));
  }

  async saveDraft(dto: CraftDto) {
    const config = this.check(dto);
    const pendingMaterials = json(dto.pendingMaterials ?? []);
    await this.prisma.craftConfig.upsert({ where: { id: 'draft' }, create: { id: 'draft', config: json(config), pendingMaterials }, update: { config: json(config), pendingMaterials } });
    return this.get();
  }

  async discardDraft() {
    await this.prisma.craftConfig.deleteMany({ where: { id: 'draft' } });
    return this.get();
  }

  // Lưu lên web. Trả thêm nguyên liệu vừa tạo và các mã cấu hình trỏ tới mà Kho không có (web coi như hết hàng)
  async publish(dto: CraftDto, by: string) {
    const config = this.check(dto);
    const used = materialIds(config);
    return this.prisma.$transaction(async (tx) => {
      const created = await this.materials.createManyIn(
        tx,
        (dto.pendingMaterials ?? []).filter((m) => used.has(m.id!)),
        by,
      );
      await tx.craftConfig.upsert({ where: { id: 'saved' }, create: { id: 'saved', config: json(config) }, update: { config: json(config) } });
      await tx.craftConfig.deleteMany({ where: { id: 'draft' } });
      const known = new Set((await tx.material.findMany({ where: { id: { in: [...used] } }, select: { id: true } })).map((m) => m.id));
      const row = await tx.craftConfig.findUniqueOrThrow({ where: { id: 'saved' } });
      return { saved: { ...(row.config as object), updatedAt: row.updatedAt.toISOString() }, createdMaterials: created, missingMaterials: [...used].filter((id) => !known.has(id)) };
    });
  }
}

@ApiTags('craft')
@ApiBearerAuth()
@Controller('admin/craft')
export class CraftController {
  constructor(private readonly craft: CraftService) {}

  @Get()
  get() {
    return this.craft.get();
  }

  @Put('draft')
  saveDraft(@Body() body: CraftDto) {
    return this.craft.saveDraft(body);
  }

  @Delete('draft')
  discardDraft() {
    return this.craft.discardDraft();
  }

  @Post('publish')
  @HttpCode(200)
  publish(@Body() body: CraftDto, @Req() req: AuthedRequest) {
    return this.craft.publish(body, req.session?.name ?? 'Admin');
  }
}

@Module({ imports: [MaterialsModule], controllers: [CraftController], providers: [CraftService] })
export class CraftModule {}
