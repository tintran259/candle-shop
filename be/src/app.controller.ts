import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './auth/auth.guard.js';
import { PrismaService } from './prisma/prisma.service.js';

// Kiểm tra máy chủ, không cần đăng nhập.
// - GET /health: chỉ báo BE còn sống, KHÔNG chạm DB — Render health check và dịch vụ giữ thức (UptimeRobot) gọi đường này,
//   để BE không ngủ mà DB Neon vẫn tự ngủ khi không ai dùng (không tốn giờ chạy DB của gói free).
// - GET /health/db: kiểm tra thêm kết nối DB (đánh thức DB) — chỉ gọi khi cần xem DB còn kết nối được không.
@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  health() {
    return { ok: true };
  }

  @Public()
  @Get('db')
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, db: true };
    } catch {
      throw new ServiceUnavailableException('Không kết nối được DB.');
    }
  }
}
