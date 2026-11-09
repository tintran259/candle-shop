// Danh mục sản phẩm (docs/pages/categories.md). Trả đúng dạng Category của BO: { id, name: { vi, en }, color, hidden }
import { Body, ConflictException, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { fold, uniqueSlug } from '../common/text.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Category as Row } from '../generated/prisma/client.js';

// Màu tag preset của antd (bo/src/lib/products/categories.ts)
const COLORS = ['default', 'magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'];

class NameDto {
  @IsString() @MinLength(1, { message: 'Nhập tên danh mục.' }) @MaxLength(40) vi: string;
  @IsString() @MaxLength(40) en: string;
}

class CreateCategoryDto {
  // Bỏ trống thì tạo từ tên tiếng Việt
  @IsOptional() @IsString() @MaxLength(60) id?: string;
  @ValidateNested() @Type(() => NameDto) name: NameDto;
  @IsOptional() @IsIn(COLORS) color?: string;
  @IsOptional() @IsBoolean() hidden?: boolean;
}

class UpdateCategoryDto {
  @IsOptional() @ValidateNested() @Type(() => NameDto) name?: NameDto;
  @IsOptional() @IsIn(COLORS) color?: string;
  @IsOptional() @IsBoolean() hidden?: boolean;
}

class OrderDto {
  @ArrayMinSize(1) @IsString({ each: true }) ids: string[];
}

const toDto = (c: Row) => ({ id: c.id, name: { vi: c.nameVi, en: c.nameEn }, color: c.color, hidden: c.hidden });

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })).map(toDto);
  }

  // Tên trùng (không dấu, không phân biệt hoa thường) với danh mục khác
  private async assertNameFree(vi: string, selfId?: string) {
    const all = await this.prisma.category.findMany({ select: { id: true, nameVi: true } });
    if (all.some((c) => c.id !== selfId && fold(c.nameVi) === fold(vi))) throw new ConflictException('Đã có danh mục tên này.');
  }

  async create(dto: CreateCategoryDto) {
    await this.assertNameFree(dto.name.vi);
    const all = await this.prisma.category.findMany({ select: { id: true, sortOrder: true } });
    const taken = new Set(all.map((c) => c.id));
    if (dto.id && taken.has(dto.id)) throw new ConflictException('Mã danh mục đã tồn tại.');
    const row = await this.prisma.category.create({
      data: {
        id: dto.id ?? uniqueSlug(dto.name.vi, taken, 'danh-muc'),
        nameVi: dto.name.vi.trim(),
        nameEn: dto.name.en.trim() || dto.name.vi.trim(),
        color: dto.color ?? 'default',
        hidden: dto.hidden ?? false,
        sortOrder: all.reduce((m, c) => Math.max(m, c.sortOrder + 1), 0),
      },
    });
    return toDto(row);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.find(id);
    if (dto.name) await this.assertNameFree(dto.name.vi, id);
    const row = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { nameVi: dto.name.vi.trim(), nameEn: dto.name.en.trim() || dto.name.vi.trim() }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.hidden !== undefined && { hidden: dto.hidden }),
      },
    });
    return toDto(row);
  }

  // Sắp xếp theo đúng thứ tự ids (kéo thả trên BO). ids phải đủ và đúng mọi danh mục
  async reorder(ids: string[]) {
    const all = await this.prisma.category.findMany({ select: { id: true } });
    if (ids.length !== all.length || new Set(ids).size !== ids.length || !all.every((c) => ids.includes(c.id))) throw new ConflictException('Danh sách sắp xếp không khớp danh mục hiện có.');
    await this.prisma.$transaction(ids.map((id, i) => this.prisma.category.update({ where: { id }, data: { sortOrder: i } })));
    return this.list();
  }

  // Chỉ xóa được khi không còn sản phẩm nào thuộc danh mục
  async remove(id: string) {
    await this.find(id);
    const used = await this.prisma.product.count({ where: { categoryId: id } });
    if (used) throw new ConflictException(`Danh mục còn ${used} sản phẩm — chuyển sản phẩm sang danh mục khác trước khi xóa.`);
    await this.prisma.category.delete({ where: { id } });
  }

  private async find(id: string) {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy danh mục.');
    return row;
  }
}

@ApiTags('categories')
@ApiBearerAuth()
@Controller('admin/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.categories.create(body);
  }

  @Put('order')
  reorder(@Body() body: OrderDto) {
    return this.categories.reorder(body.ids);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.categories.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}

@Module({ controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}
