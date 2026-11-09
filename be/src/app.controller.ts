import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './auth/auth.guard.js';
import { PrismaService } from './prisma/prisma.service.js';

// Kiểm tra máy chủ còn sống và kết nối được DB — dùng cho Render health check, không cần đăng nhập
@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch {
      throw new ServiceUnavailableException('Không kết nối được DB.');
    }
  }
}
