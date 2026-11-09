// Sản phẩm hủy đơn (docs/pages/cancelled-products.md): nến tự phối đã làm xong nhưng đơn bị hủy. Chỉ quản lý ở BO.
// Bản ghi do API đơn hàng tạo khi hủy đơn đã làm (nhóm 4). Ở đây: xem danh sách, đổi trạng thái (bỏ / đã tạo sản phẩm trưng bày)
import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { CancelledProduct as Row } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const STATUS = ['pending', 'converted', 'discarded'] as const;

class PatchCancelledDto {
  // pending = chưa xử lý, converted = đã tạo sản phẩm trưng bày, discarded = đã bỏ
  @IsIn(STATUS) status: (typeof STATUS)[number];
  // Bắt buộc khi converted: sản phẩm trưng bày vừa tạo từ bản ghi này
  @IsOptional() @IsString() displayProductId?: string;
}

const opt = <T>(v: T | null) => v ?? undefined;
const toDto = (c: Row) => ({
  id: c.id,
  name: c.name,
  custom: opt(c.custom),
  recipe: opt(c.recipe as { materialId: string; quantity: number }[] | null),
  personalized: c.personalized,
  images: c.images,
  price: c.price,
  quantity: c.quantity,
  orderId: c.orderId,
  orderCode: c.orderCode,
  customerName: c.customerName,
  cancelReason: c.cancelReason,
  cancelledAt: c.cancelledAt.toISOString(),
  status: c.status,
  displayProductId: opt(c.displayProductId),
  updatedAt: c.updatedAt.toISOString(),
});

@Injectable()
export class CancelledService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.cancelledProduct.findMany({ orderBy: [{ cancelledAt: 'desc' }, { id: 'asc' }] })).map(toDto);
  }

  async get(id: string) {
    const row = await this.prisma.cancelledProduct.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy sản phẩm hủy đơn.');
    return row;
  }

  async patch(id: string, dto: PatchCancelledDto) {
    await this.get(id);
    if (dto.status === 'converted') {
      if (!dto.displayProductId) throw new BadRequestException('Cần mã sản phẩm trưng bày đã tạo.');
      if (!(await this.prisma.product.findUnique({ where: { id: dto.displayProductId } }))) throw new BadRequestException('Không tìm thấy sản phẩm trưng bày này.');
    }
    const row = await this.prisma.cancelledProduct.update({
      where: { id },
      data: { status: dto.status, displayProductId: dto.status === 'converted' ? dto.displayProductId : null, updatedAt: new Date() },
    });
    return toDto(row);
  }
}

@ApiTags('cancelled-products')
@ApiBearerAuth()
@Controller('admin/cancelled-products')
export class CancelledController {
  constructor(private readonly cancelled: CancelledService) {}

  @Get()
  list() {
    return this.cancelled.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return toDto(await this.cancelled.get(id));
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: PatchCancelledDto) {
    return this.cancelled.patch(id, body);
  }
}

@Module({ controllers: [CancelledController], providers: [CancelledService], exports: [CancelledService] })
export class CancelledModule {}
