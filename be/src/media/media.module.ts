// Kho ảnh (BO › Cài đặt › Kho ảnh, docs/pages/media.md): xem mọi ảnh trên Cloudinary trong thư mục candle2510/,
// biết ảnh đang dùng ở đâu, xóa ảnh không còn dùng. Ảnh đang dùng thì BE từ chối xóa (kiểm tra lại lúc xóa)
import { Body, ConflictException, Controller, Get, HttpCode, Module, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { destroyImages, listImages, ROOT, type CloudImage } from './cloudinary.js';
import { imageSources, usedIn } from './usage.js';

class DeleteDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @IsString({ each: true }) publicIds: string[];
}

// Thư mục con dưới candle2510/: products | craft | orders | site | misc (khác thì "misc")
const folderOf = (img: CloudImage) => {
  const f = (img.asset_folder ?? img.folder ?? img.public_id.split('/').slice(0, -1).join('/')).replace(`${ROOT}/`, '');
  return ['products', 'craft', 'orders', 'site'].includes(f) ? f : 'misc';
};

@ApiTags('media')
@ApiBearerAuth()
@Controller('admin/media')
export class MediaController {
  constructor(private readonly prisma: PrismaService) {}

  // Mọi ảnh, mới nhất trước, kèm nơi đang dùng (usedIn trống = ảnh thừa)
  @Get()
  async list() {
    const [images, sources] = await Promise.all([listImages(), imageSources(this.prisma)]);
    return images.map((img) => ({
      publicId: img.public_id,
      name: img.public_id.split('/').pop()!,
      folder: folderOf(img),
      url: img.secure_url,
      format: img.format,
      bytes: img.bytes,
      width: img.width,
      height: img.height,
      createdAt: img.created_at,
      usedIn: usedIn(sources, img.public_id),
    }));
  }

  // Xóa ảnh không còn dùng. Có ảnh đang dùng thì không xóa ảnh nào (409, kèm nơi dùng)
  @Post('delete')
  @HttpCode(200)
  async remove(@Body() body: DeleteDto) {
    const sources = await imageSources(this.prisma);
    const used = body.publicIds.flatMap((id) => {
      const where = usedIn(sources, id);
      return where.length ? [`${id.split('/').pop()} (${where.join(', ')})`] : [];
    });
    if (used.length) throw new ConflictException(`Ảnh đang được dùng, không xóa: ${used.join('; ')}.`);
    return { deleted: await destroyImages(body.publicIds) };
  }
}

@Module({ controllers: [MediaController] })
export class MediaModule {}
