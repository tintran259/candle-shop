// Trạng thái phụ của BO, lưu theo tài khoản thay vì từng trình duyệt:
// đơn đang tạo dở (docs/pages/orders.md#đơn-nháp) và id các thông báo đã đọc
import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsObject, IsString } from 'class-validator';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

class OrderDraftDto {
  // Giá trị form Tạo đơn (ngày làm xong dạng YYYY-MM-DD). Không giữ nguyên liệu, không tính lượt mã giảm giá
  @IsObject() values: Record<string, unknown>;
}

class ReadDto {
  @ArrayMaxSize(1000) @IsString({ each: true }) ids: string[];
}

@Injectable()
export class DraftsService {
  constructor(private readonly prisma: PrismaService) {}

  async orderDraft() {
    const row = await this.prisma.orderDraft.findUnique({ where: { id: 'current' } });
    return row ? { values: row.values, savedAt: row.savedAt.toISOString() } : null;
  }

  async saveOrderDraft(values: Record<string, unknown>) {
    const data = { values: values as Prisma.InputJsonValue, savedAt: new Date() };
    await this.prisma.orderDraft.upsert({ where: { id: 'current' }, create: { id: 'current', ...data }, update: data });
    return this.orderDraft();
  }

  async clearOrderDraft() {
    await this.prisma.orderDraft.deleteMany();
  }

  async readIds() {
    return (await this.prisma.notificationRead.findMany({ orderBy: { readAt: 'asc' } })).map((r) => r.id);
  }

  async markRead(ids: string[]) {
    await this.prisma.notificationRead.createMany({ data: [...new Set(ids)].map((id) => ({ id })), skipDuplicates: true });
    return this.readIds();
  }
}

@ApiTags('drafts')
@ApiBearerAuth()
@Controller('admin')
export class DraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get('order-draft')
  orderDraft() {
    return this.drafts.orderDraft();
  }

  @Put('order-draft')
  saveOrderDraft(@Body() body: OrderDraftDto) {
    return this.drafts.saveOrderDraft(body.values);
  }

  @Delete('order-draft')
  @HttpCode(204)
  clearOrderDraft() {
    return this.drafts.clearOrderDraft();
  }

  @Get('notifications/read')
  readIds() {
    return this.drafts.readIds();
  }

  @Post('notifications/read')
  @HttpCode(200)
  markRead(@Body() body: ReadDto) {
    return this.drafts.markRead(body.ids);
  }
}

@Module({ controllers: [DraftsController], providers: [DraftsService] })
export class DraftsModule {}
