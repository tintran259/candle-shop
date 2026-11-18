// Pha màu (docs/pages/color-mix.md): BO gửi cả bản dữ liệu mẫu (bột oxit + màu nước), BE lưu nguyên một dòng.
// Công thức do BO tự tính từ dữ liệu này, BE không tính
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

class ColorMixDto {
  // { version, sets: { oxide: {...}, liquid: {...} } }
  @IsObject() data: Record<string, unknown>;
}

const MODES = ['oxide', 'liquid'] as const;

// Kiểm tra khung tối thiểu: đủ hai bộ, mỗi bộ có màu nền và danh sách màu — chi tiết bên trong do BO quản lý
export function checkColorMix(data: Record<string, unknown>) {
  const sets = data.sets as
    | Record<string, { base?: unknown; pigments?: unknown; checks?: unknown }>
    | undefined;
  if (!sets || typeof sets !== 'object')
    throw new BadRequestException('Thiếu dữ liệu pha màu (sets).');
  for (const m of MODES) {
    const s = sets[m];
    if (
      !s ||
      typeof s.base !== 'string' ||
      !Array.isArray(s.pigments) ||
      !Array.isArray(s.checks)
    )
      throw new BadRequestException(`Dữ liệu pha màu "${m}" không hợp lệ.`);
  }
}

@Injectable()
export class ColorMixService {
  constructor(private readonly prisma: PrismaService) {}

  // null = chưa lưu lần nào, BO dùng dữ liệu minh họa
  async get() {
    const row = await this.prisma.colorMix.findUnique({
      where: { id: 'current' },
    });
    return row ? row.data : null;
  }

  async save(data: Record<string, unknown>) {
    checkColorMix(data);
    const value = data as Prisma.InputJsonValue;
    const row = await this.prisma.colorMix.upsert({
      where: { id: 'current' },
      create: { id: 'current', data: value },
      update: { data: value },
    });
    return row.data;
  }
}

@ApiTags('color-mix')
@ApiBearerAuth()
@Controller('admin/color-mix')
export class ColorMixController {
  constructor(private readonly colorMix: ColorMixService) {}

  @Get()
  get() {
    return this.colorMix.get();
  }

  @Put()
  save(@Body() body: ColorMixDto) {
    return this.colorMix.save(body.data);
  }
}

@Module({ controllers: [ColorMixController], providers: [ColorMixService] })
export class ColorMixModule {}
