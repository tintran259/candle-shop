// Kho ảnh Cloudinary: BO tải ảnh thẳng lên Cloudinary, BE chỉ ký phép tải lên (khóa bí mật nằm ở BE, không lộ ra trình duyệt).
// DB chỉ lưu URL ảnh. Chưa cấu hình (thiếu biến CLOUDINARY_*) thì trả 503 — BO lưu ảnh kiểu cũ (data URL) cho tới khi cấu hình
import { Body, Controller, HttpCode, Module, Post, ServiceUnavailableException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createHash } from 'node:crypto';
import { IsIn, IsOptional } from 'class-validator';

// Thư mục trên Cloudinary theo nơi dùng ảnh
export const FOLDERS = ['products', 'craft', 'orders', 'site', 'misc'] as const;
const ROOT = 'candle2510';

class SignDto {
  @IsOptional() @IsIn(FOLDERS) folder?: (typeof FOLDERS)[number];
}

// Chữ ký Cloudinary: các tham số (trừ file, api_key) xếp theo tên, nối "a=1&b=2", thêm api_secret, băm SHA-1
export function signParams(params: Record<string, string | number>, secret: string) {
  const text = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1')
    .update(text + secret)
    .digest('hex');
}

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('admin/uploads')
export class UploadsController {
  // Trả tham số để BO POST file tới uploadUrl (multipart: file, api_key, timestamp, folder, signature). Chữ ký dùng trong 1 giờ
  @Post('sign')
  @HttpCode(200)
  sign(@Body() body: SignDto) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !secret) throw new ServiceUnavailableException('Chưa cấu hình kho ảnh (Cloudinary).');
    const folder = `${ROOT}/${body.folder ?? 'misc'}`;
    const timestamp = Math.floor(Date.now() / 1000);
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      apiKey,
      timestamp,
      folder,
      signature: signParams({ folder, timestamp }, secret),
    };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
