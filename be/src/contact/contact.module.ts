// Lời nhắn liên hệ (docs/pages/messages.md): khách gửi ở form "Gửi lời nhắn" trang chủ web → POST /api/shop/messages (công khai);
// BO › Bán hàng › Liên hệ xem, đánh dấu đã xử lý, xóa (GET / PATCH / DELETE /api/admin/messages).
// Chống spam (người gửi thật không thấy gì khác):
//   - ô bẫy `website` (người thật không thấy, bot điền) và gửi quá nhanh (`elapsed` < 3 giây từ lúc mở form, hoặc không có — gọi thẳng API) → trả ok, không lưu
//   - mỗi IP tối đa 5 lời nhắn / 10 phút (trong bộ nhớ) → 429
//   - cùng SĐT + cùng nội dung trong 24 giờ → trả ok, chỉ lưu lần đầu
//   - mỗi SĐT tối đa 3 lời nhắn / 24 giờ → 429 (báo khách shop sẽ liên lạc lại)
import { Body, Controller, Delete, Get, HttpCode, HttpException, Injectable, Module, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';
import type { Request } from 'express';
import { Public } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

const WINDOW_MS = 10 * 60_000;
const PER_IP = 5;
const MIN_ELAPSED_MS = 3000;
const DAY_MS = 24 * 3_600_000;
const PER_PHONE_PER_DAY = 3;
// So SĐT / nội dung: 0901 234 567 = +84901234567; nội dung bỏ khác biệt hoa thường, khoảng trắng
export const phoneKey = (p: string) => p.replace(/\D/g, '').replace(/^84(?=\d{9}$)/, '0');
const textKey = (t: string) => t.toLowerCase().replace(/\s+/g, ' ').trim();
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class MessageDto {
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập họ tên.' }) @MaxLength(60, { message: 'Họ tên tối đa 60 ký tự.' }) name: string;
  @Transform(trim) @IsString() @Matches(/^[\d\s+.()-]{8,20}$/, { message: 'Số điện thoại không đúng.' }) phone: string;
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @ValidateIf((_, v) => v !== '')
  @IsEmail({}, { message: 'Email không đúng.' })
  @MaxLength(254)
  email?: string;
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Vui lòng nhập nội dung.' }) @MaxLength(1000, { message: 'Nội dung tối đa 1000 ký tự.' }) message: string;
  // Ô bẫy bot: web để trống và ẩn
  @IsOptional() @IsString() @MaxLength(200) website?: string;
  // Số mili giây từ lúc mở form tới lúc gửi (web tự gửi kèm)
  @IsOptional() @IsInt() @Min(0) elapsed?: number;
}

class HandledDto {
  @IsBoolean() handled: boolean;
}

@Injectable()
export class ContactService {
  private readonly hits = new Map<string, { count: number; start: number }>();

  constructor(private readonly prisma: PrismaService) {}

  // true = vượt giới hạn
  private limited(ip: string, now = Date.now()) {
    if (this.hits.size > 5000) for (const [k, h] of this.hits) if (now - h.start >= WINDOW_MS) this.hits.delete(k);
    const h = this.hits.get(ip);
    if (!h || now - h.start >= WINDOW_MS) {
      this.hits.set(ip, { count: 1, start: now });
      return false;
    }
    h.count += 1;
    return h.count > PER_IP;
  }

  async send(dto: MessageDto, ip: string) {
    if (dto.website || (dto.elapsed ?? 0) < MIN_ELAPSED_MS) return { ok: true };
    if (this.limited(ip)) throw new HttpException('Bạn gửi quá nhiều lần, thử lại sau ít phút.', 429);
    const key = phoneKey(dto.phone);
    const recent = (await this.prisma.contactMessage.findMany({ where: { createdAt: { gte: new Date(Date.now() - DAY_MS) } }, select: { phone: true, message: true } })).filter(
      (m) => phoneKey(m.phone) === key,
    );
    if (recent.some((m) => textKey(m.message) === textKey(dto.message))) return { ok: true };
    if (recent.length >= PER_PHONE_PER_DAY) throw new HttpException('Số điện thoại này đã gửi nhiều lời nhắn hôm nay — chúng tôi sẽ liên lạc lại với bạn sớm.', 429);
    await this.prisma.contactMessage.create({ data: { name: dto.name, phone: dto.phone, email: dto.email ?? '', message: dto.message } });
    return { ok: true };
  }

  list() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async setHandled(id: string, handled: boolean) {
    const { count } = await this.prisma.contactMessage.updateMany({ where: { id }, data: { handled } });
    if (!count) throw new NotFoundException('Không tìm thấy lời nhắn.');
    return this.list();
  }

  async remove(id: string) {
    const { count } = await this.prisma.contactMessage.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException('Không tìm thấy lời nhắn.');
    return this.list();
  }
}

@ApiTags('shop')
@Public()
@Controller('shop/messages')
export class ShopMessagesController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(201)
  send(@Body() dto: MessageDto, @Req() req: Request) {
    return this.contact.send(dto, req.ip ?? 'unknown');
  }
}

@ApiTags('messages')
@ApiBearerAuth()
@Controller('admin/messages')
export class MessagesController {
  constructor(private readonly contact: ContactService) {}

  @Get()
  list() {
    return this.contact.list();
  }

  @Patch(':id')
  setHandled(@Param('id') id: string, @Body() dto: HandledDto) {
    return this.contact.setHandled(id, dto.handled);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contact.remove(id);
  }
}

@Module({ controllers: [ShopMessagesController, MessagesController], providers: [ContactService] })
export class ContactModule {}
