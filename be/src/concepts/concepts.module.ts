// Concept (dịp lễ / bộ sưu tập: Noel, Tết…) — phân loại thứ hai bên cạnh danh mục (docs/pages/concepts.md).
// Giống danh mục: { id, name: { vi, en }, color, hidden }, kéo thả thứ tự. Khác: sản phẩm thuộc 0..n concept (không bắt buộc),
// nên xóa concept đang có sản phẩm vẫn được — sản phẩm chỉ rời khỏi concept đó.
// Thời gian startsOn / endsOn (YYYY-MM-DD, giờ VN, trống = mọi ngày): quy tắc mở / đóng bán trên web ở season.ts
import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { fold, uniqueSlug } from '../common/text.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Concept as Row } from '../generated/prisma/client.js';
import { dayOf } from './season.js';

// Màu tag preset của antd (bo/src/lib/products/categories.ts) — dùng chung với danh mục
const COLORS = ['default', 'magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'];

class NameDto {
  @IsString()
  @MinLength(1, { message: 'Nhập tên concept.' })
  @MaxLength(40)
  vi: string;
  @IsString() @MaxLength(40) en: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

class CreateConceptDto {
  // Bỏ trống thì tạo từ tên tiếng Việt
  @IsOptional() @IsString() @MaxLength(60) id?: string;
  @ValidateNested() @Type(() => NameDto) name: NameDto;
  @IsOptional() @IsIn(COLORS) color?: string;
  @IsOptional() @IsBoolean() hidden?: boolean;
  // Ngày bắt đầu / kết thúc (YYYY-MM-DD). null = bỏ ngày (mọi ngày)
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(DATE, { message: 'Ngày không đúng định dạng.' })
  startsOn?: string | null;
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(DATE, { message: 'Ngày không đúng định dạng.' })
  endsOn?: string | null;
}

class UpdateConceptDto {
  @IsOptional() @ValidateNested() @Type(() => NameDto) name?: NameDto;
  @IsOptional() @IsIn(COLORS) color?: string;
  @IsOptional() @IsBoolean() hidden?: boolean;
  // Ngày bắt đầu / kết thúc (YYYY-MM-DD). null = bỏ ngày (mọi ngày)
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(DATE, { message: 'Ngày không đúng định dạng.' })
  startsOn?: string | null;
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(DATE, { message: 'Ngày không đúng định dạng.' })
  endsOn?: string | null;
}

class OrderDto {
  @ArrayMinSize(1) @IsString({ each: true }) ids: string[];
}

const toDto = (c: Row) => ({
  id: c.id,
  name: { vi: c.nameVi, en: c.nameEn },
  color: c.color,
  hidden: c.hidden,
  startsOn: dayOf(c.startsOn),
  endsOn: dayOf(c.endsOn),
});

// Chuỗi ngày → cột DATE (nửa đêm UTC). Ngày không có thật (vd 2026-02-30) thì báo lỗi
const toDate = (v: string | null | undefined) => {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || dayOf(d) !== v) throw new BadRequestException('Ngày không đúng.');
  return d;
};
const assertRange = (start: Date | null, end: Date | null) => {
  if (start && end && end < start) throw new BadRequestException('Ngày kết thúc phải sau hoặc trùng ngày bắt đầu.');
};

@Injectable()
export class ConceptsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.concept.findMany({ orderBy: { sortOrder: 'asc' } })).map(toDto);
  }

  // Tên trùng (không dấu, không phân biệt hoa thường) với concept khác
  private async assertNameFree(vi: string, selfId?: string) {
    const all = await this.prisma.concept.findMany({
      select: { id: true, nameVi: true },
    });
    if (all.some((c) => c.id !== selfId && fold(c.nameVi) === fold(vi))) throw new ConflictException('Đã có concept tên này.');
  }

  async create(dto: CreateConceptDto) {
    await this.assertNameFree(dto.name.vi);
    const all = await this.prisma.concept.findMany({
      select: { id: true, sortOrder: true },
    });
    const taken = new Set(all.map((c) => c.id));
    if (dto.id && taken.has(dto.id)) throw new ConflictException('Mã concept đã tồn tại.');
    const startsOn = toDate(dto.startsOn);
    const endsOn = toDate(dto.endsOn);
    assertRange(startsOn, endsOn);
    const row = await this.prisma.concept.create({
      data: {
        startsOn,
        endsOn,
        id: dto.id ?? uniqueSlug(dto.name.vi, taken, 'concept'),
        nameVi: dto.name.vi.trim(),
        nameEn: dto.name.en.trim() || dto.name.vi.trim(),
        color: dto.color ?? 'default',
        hidden: dto.hidden ?? false,
        sortOrder: all.reduce((m, c) => Math.max(m, c.sortOrder + 1), 0),
      },
    });
    return toDto(row);
  }

  async update(id: string, dto: UpdateConceptDto) {
    const current = await this.find(id);
    // Không gửi = giữ ngày cũ; null = bỏ ngày
    const startsOn = dto.startsOn === undefined ? current.startsOn : toDate(dto.startsOn);
    const endsOn = dto.endsOn === undefined ? current.endsOn : toDate(dto.endsOn);
    assertRange(startsOn, endsOn);
    if (dto.name) await this.assertNameFree(dto.name.vi, id);
    const row = await this.prisma.concept.update({
      where: { id },
      data: {
        ...(dto.name && {
          nameVi: dto.name.vi.trim(),
          nameEn: dto.name.en.trim() || dto.name.vi.trim(),
        }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.hidden !== undefined && { hidden: dto.hidden }),
        startsOn,
        endsOn,
      },
    });
    return toDto(row);
  }

  // Sắp xếp theo đúng thứ tự ids (kéo thả trên BO). ids phải đủ và đúng mọi concept
  async reorder(ids: string[]) {
    const all = await this.prisma.concept.findMany({ select: { id: true } });
    if (ids.length !== all.length || new Set(ids).size !== ids.length || !all.every((c) => ids.includes(c.id))) throw new ConflictException('Danh sách sắp xếp không khớp concept hiện có.');
    await this.prisma.$transaction(ids.map((id, i) => this.prisma.concept.update({ where: { id }, data: { sortOrder: i } })));
    return this.list();
  }

  // Xóa luôn được: liên kết với sản phẩm trong bảng nối tự xóa theo (ON DELETE CASCADE)
  async remove(id: string) {
    await this.find(id);
    await this.prisma.concept.delete({ where: { id } });
  }

  private async find(id: string) {
    const row = await this.prisma.concept.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy concept.');
    return row;
  }
}

@ApiTags('concepts')
@ApiBearerAuth()
@Controller('admin/concepts')
export class ConceptsController {
  constructor(private readonly concepts: ConceptsService) {}

  @Get()
  list() {
    return this.concepts.list();
  }

  @Post()
  create(@Body() body: CreateConceptDto) {
    return this.concepts.create(body);
  }

  @Put('order')
  reorder(@Body() body: OrderDto) {
    return this.concepts.reorder(body.ids);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateConceptDto) {
    return this.concepts.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.concepts.remove(id);
  }
}

@Module({ controllers: [ConceptsController], providers: [ConceptsService] })
export class ConceptsModule {}
