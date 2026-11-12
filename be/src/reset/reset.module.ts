// Xóa toàn bộ dữ liệu BO, chỉ giữ đăng nhập (Cài đặt › Xóa toàn bộ dữ liệu). Phải gửi đúng câu xác nhận để không lỡ tay gọi nhầm
import { BadRequestException, Body, Controller, HttpCode, Module, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { WebRevalidate } from '../common/web-revalidate.js';
import { wipeBoData } from '../common/wipe.js';
import { DEFAULT_CRAFT } from '../craft/default-config.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const RESET_PHRASE = 'XÓA HẾT';

// Thủ công sau khi xóa: giữ các bước của cấu hình mẫu, bỏ mọi lựa chọn (và tuỳ chọn thêm gắn Kho) — lựa chọn mẫu trỏ tới Kho mẫu không còn.
// Ô nhập chữ (khắc tên, lời nhắn) không gắn Kho nên giữ
export const emptyCraft = () => ({
  ...DEFAULT_CRAFT,
  steps: DEFAULT_CRAFT.steps.map((s) => (s.kind === 'inputs' ? { ...s, addons: [] } : { ...s, options: [] })),
});

class ResetDto {
  @IsString() confirm: string;
}

@ApiTags('reset')
@ApiBearerAuth()
@Controller('admin/reset')
export class ResetController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web: WebRevalidate,
  ) {}

  // Lần GET cài đặt sau đó tự tạo lại giá trị mặc định; Thủ công ghi sẵn các bước không có lựa chọn
  @Post()
  @HttpCode(204)
  async reset(@Body() body: ResetDto) {
    if (body.confirm.trim().toUpperCase() !== RESET_PHRASE) throw new BadRequestException(`Gõ đúng "${RESET_PHRASE}" để xác nhận.`);
    await this.prisma.$transaction(
      async (tx) => {
        await wipeBoData(tx);
        await tx.craftConfig.create({ data: { id: 'saved', config: emptyCraft() as unknown as Prisma.InputJsonValue } });
      },
      { timeout: 60_000 },
    );
    // Giao diện web đã đăng bị xóa → web về nội dung có sẵn ngay
    this.web.siteTheme();
  }
}

@Module({ controllers: [ResetController], providers: [WebRevalidate] })
export class ResetModule {}
