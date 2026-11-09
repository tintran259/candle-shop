// Khách hàng (docs/pages/customers.md). Hồ sơ gộp theo số điện thoại. Trả đúng dạng Customer của BO.
// Số liệu mua hàng (số đơn, đã chi, nhóm) BO tự tính từ đơn — API này chỉ giữ hồ sơ.
import { Body, ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { phoneKey, slugify } from '../common/text.js';
import type { Customer as Row } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PHONE = /^[\d\s+.()-]{9,20}$/;

class CreateCustomerDto {
  @IsOptional() @IsString() @MaxLength(60) id?: string;
  @IsString() @MinLength(1, { message: 'Nhập tên khách.' }) @MaxLength(60) name: string;
  @Matches(PHONE, { message: 'Số điện thoại chưa đúng.' }) phone: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail({}, { message: 'Email chưa đúng.' }) email?: string;
  @IsOptional() @IsBoolean() hasAccount?: boolean;
  @IsOptional() @IsBoolean() newsletter?: boolean;
  @IsOptional() @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsDateString() createdAt?: string;
}

class UpdateCustomerDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(60) name?: string;
  @IsOptional() @Matches(PHONE, { message: 'Số điện thoại chưa đúng.' }) phone?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail({}, { message: 'Email chưa đúng.' }) email?: string;
  @IsOptional() @IsBoolean() newsletter?: boolean;
  @IsOptional() @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsBoolean() blocked?: boolean;
  @IsOptional() @IsString() @MaxLength(300) blockReason?: string;
}

const opt = <T>(v: T | null) => v ?? undefined;
const toDto = (c: Row) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  hasAccount: c.hasAccount,
  newsletter: c.newsletter,
  tags: c.tags,
  note: opt(c.note),
  blocked: c.blocked,
  blockReason: opt(c.blockReason),
  createdAt: c.createdAt.toISOString(),
});

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' } })).map(toDto);
  }

  async get(id: string) {
    const row = await this.prisma.customer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy khách hàng.');
    return row;
  }

  // Số điện thoại đã thuộc hồ sơ khác thì báo lại hồ sơ đó (BO gộp khách theo số điện thoại)
  private async assertPhoneFree(phone: string, selfId?: string) {
    const key = phoneKey(phone);
    const all = await this.prisma.customer.findMany({ select: { id: true, name: true, phone: true } });
    const other = all.find((c) => c.id !== selfId && phoneKey(c.phone) === key);
    if (other) throw new ConflictException({ message: `Số này đã thuộc hồ sơ ${other.name}.`, customerId: other.id });
  }

  async create(dto: CreateCustomerDto) {
    await this.assertPhoneFree(dto.phone);
    const id = dto.id ?? `cus-${phoneKey(dto.phone).slice(-6) || slugify(dto.name)}`;
    if (await this.prisma.customer.findUnique({ where: { id } })) throw new ConflictException('Mã khách đã tồn tại.');
    const row = await this.prisma.customer.create({
      data: {
        id,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim() ?? '',
        hasAccount: dto.hasAccount ?? false,
        newsletter: dto.newsletter ?? false,
        tags: dto.tags ?? [],
        note: dto.note?.trim() || null,
        ...(dto.createdAt && { createdAt: new Date(dto.createdAt) }),
      },
    });
    return toDto(row);
  }

  // Sửa hồ sơ: nhãn, ghi chú, chặn đặt hàng… Bỏ chặn thì xóa lý do chặn
  async update(id: string, dto: UpdateCustomerDto) {
    await this.get(id);
    if (dto.phone) await this.assertPhoneFree(dto.phone, id);
    const row = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
        ...(dto.email !== undefined && { email: dto.email.trim() }),
        ...(dto.newsletter !== undefined && { newsletter: dto.newsletter }),
        ...(dto.tags !== undefined && { tags: [...new Set(dto.tags.map((t) => t.trim()).filter(Boolean))] }),
        ...(dto.note !== undefined && { note: dto.note.trim() || null }),
        ...(dto.blocked !== undefined && { blocked: dto.blocked, blockReason: dto.blocked ? dto.blockReason?.trim() || null : null }),
      },
    });
    return toDto(row);
  }
}

@ApiTags('customers')
@ApiBearerAuth()
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list() {
    return this.customers.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return toDto(await this.customers.get(id));
  }

  @Post()
  create(@Body() body: CreateCustomerDto) {
    return this.customers.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.customers.update(id, body);
  }
}

@Module({ controllers: [CustomersController], providers: [CustomersService], exports: [CustomersService] })
export class CustomersModule {}
