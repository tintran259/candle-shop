// Mã giảm giá (docs/pages/discounts.md). Trả đúng dạng Discount của BO, gồm customerIds của mã riêng.
// Áp mã khi tạo đơn và đếm lượt dùng làm ở API đơn hàng.
import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import type { Discount, DiscountCustomer } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Giống BO: bỏ dấu, viết hoa, chỉ giữ chữ và số
export const normalizeCode = (s = '') =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

class DiscountDto {
  @IsOptional() @IsString() @MaxLength(60) id?: string;
  @IsString() code: string;
  @IsOptional() @IsString() @MaxLength(120) description?: string;
  @IsIn(['percent', 'fixed', 'freeship']) type: 'percent' | 'fixed' | 'freeship';
  @IsInt() @Min(0) value: number;
  @IsOptional() @IsInt() @Min(0) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(0) minOrder?: number;
  @IsIn(['all', 'products', 'custom']) scope: 'all' | 'products' | 'custom';
  @IsBoolean() firstOrderOnly: boolean;
  // Mã riêng: chỉ các khách này dùng được. Trống = mọi khách
  @IsOptional() @IsString({ each: true }) customerIds?: string[];
  @Matches(DAY, { message: 'Ngày bắt đầu dạng YYYY-MM-DD.' }) startsAt: string;
  @IsOptional() @Matches(DAY, { message: 'Ngày kết thúc dạng YYYY-MM-DD.' }) endsAt?: string;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perCustomerLimit?: number;
  @IsOptional() @IsInt() @Min(0) used?: number;
  @IsBoolean() active: boolean;
  @IsOptional() @Matches(DAY) createdAt?: string;
}

// Đổi nhanh trên bảng: bật / tạm dừng; lượt dùng (đơn tạo / hủy ở BO)
class PatchDiscountDto {
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000) used?: number;
}

type Row = Discount & { customers: DiscountCustomer[] };
const opt = <T>(v: T | null) => v ?? undefined;
const toDto = (d: Row) => ({
  id: d.id,
  code: d.code,
  description: opt(d.description),
  type: d.type,
  value: d.value,
  maxDiscount: opt(d.maxDiscount),
  minOrder: opt(d.minOrder),
  scope: d.scope,
  firstOrderOnly: d.firstOrderOnly,
  ...(d.customers.length && { customerIds: d.customers.map((c) => c.customerId) }),
  startsAt: d.startsAt,
  endsAt: opt(d.endsAt),
  usageLimit: opt(d.usageLimit),
  perCustomerLimit: opt(d.perCustomerLimit),
  used: d.used,
  active: d.active,
  createdAt: d.createdAt,
});

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.discount.findMany({ include: { customers: true }, orderBy: [{ createdAt: 'desc' }, { code: 'asc' }] })).map(toDto);
  }

  private async find(id: string) {
    const row = await this.prisma.discount.findUnique({ where: { id }, include: { customers: true } });
    if (!row) throw new NotFoundException('Không tìm thấy mã giảm giá.');
    return row;
  }

  // Quy tắc giống drawer tạo / sửa mã của BO
  private async validate(dto: DiscountDto, selfId?: string) {
    const code = normalizeCode(dto.code);
    if (code.length < 4 || code.length > 20) throw new BadRequestException('Mã dài 4–20 ký tự.');
    const same = await this.prisma.discount.findUnique({ where: { code } });
    if (same && same.id !== selfId) throw new ConflictException('Mã này đã tồn tại.');
    if (dto.type === 'percent' && (dto.value < 1 || dto.value > 100)) throw new BadRequestException('Mức giảm từ 1 đến 100%.');
    if (dto.type === 'fixed' && dto.value < 1000) throw new BadRequestException('Nhập số tiền giảm.');
    if (dto.type === 'fixed' && dto.minOrder && dto.value >= dto.minOrder) throw new BadRequestException('Đơn tối thiểu phải lớn hơn số tiền giảm.');
    if (dto.endsAt && dto.endsAt < dto.startsAt) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
    const ids = [...new Set(dto.customerIds ?? [])];
    if (ids.length) {
      const found = await this.prisma.customer.count({ where: { id: { in: ids } } });
      if (found !== ids.length) throw new BadRequestException('Có khách không còn trong danh sách khách hàng.');
    }
    return { code, ids };
  }

  private data(dto: DiscountDto, code: string) {
    return {
      code,
      description: dto.description?.trim() || null,
      type: dto.type,
      value: dto.type === 'freeship' ? 0 : dto.value,
      maxDiscount: dto.type === 'percent' ? dto.maxDiscount || null : null,
      minOrder: dto.minOrder || null,
      scope: dto.scope,
      firstOrderOnly: dto.firstOrderOnly,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt || null,
      usageLimit: dto.usageLimit || null,
      perCustomerLimit: dto.perCustomerLimit || null,
      active: dto.active,
    };
  }

  async create(dto: DiscountDto) {
    const { code, ids } = await this.validate(dto);
    const id = dto.id ?? `disc-${Date.now().toString(36)}`;
    if (await this.prisma.discount.findUnique({ where: { id } })) throw new ConflictException('Mã giảm giá đã tồn tại.');
    const row = await this.prisma.discount.create({
      data: {
        id,
        ...this.data(dto, code),
        used: dto.used ?? 0,
        createdAt: dto.createdAt ?? new Date().toISOString().slice(0, 10),
        customers: { create: ids.map((customerId) => ({ customerId })) },
      },
      include: { customers: true },
    });
    return toDto(row);
  }

  // Sửa toàn bộ mã (drawer sửa mã). Giữ nguyên lượt đã dùng và ngày tạo
  async replace(id: string, dto: DiscountDto) {
    await this.find(id);
    const { code, ids } = await this.validate(dto, id);
    const row = await this.prisma.discount.update({
      where: { id },
      data: { ...this.data(dto, code), customers: { deleteMany: {}, create: ids.map((customerId) => ({ customerId })) } },
      include: { customers: true },
    });
    return toDto(row);
  }

  async patch(id: string, dto: PatchDiscountDto) {
    await this.find(id);
    const row = await this.prisma.discount.update({ where: { id }, data: dto, include: { customers: true } });
    return toDto(row);
  }

  async remove(id: string) {
    await this.find(id);
    await this.prisma.discount.delete({ where: { id } });
  }
}

@ApiTags('discounts')
@ApiBearerAuth()
@Controller('admin/discounts')
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get()
  list() {
    return this.discounts.list();
  }

  @Post()
  create(@Body() body: DiscountDto) {
    return this.discounts.create(body);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() body: DiscountDto) {
    return this.discounts.replace(id, body);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: PatchDiscountDto) {
    return this.discounts.patch(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.discounts.remove(id);
  }
}

@Module({ controllers: [DiscountsController], providers: [DiscountsService], exports: [DiscountsService] })
export class DiscountsModule {}
