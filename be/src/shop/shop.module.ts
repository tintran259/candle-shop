// API công khai cho web bán hàng (fe) — không cần đăng nhập, chỉ đọc (docs/api.md#web-bán-hàng).
// Chỉ trả sản phẩm Đang bán thuộc danh mục không ẩn, và chỉ những trường khách được xem: không có công thức (recipe),
// lựa chọn Thủ công (build), số đã bán hay trạng thái. Liên hệ: tên shop + SĐT người gửi ở Cài đặt (không trả địa chỉ lấy hàng)
import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard.js';
import type { Category, Product } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const opt = <T>(v: T | null) => v ?? undefined;

const toProduct = (p: Product) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: opt(p.description),
  price: p.price,
  salePrice: opt(p.salePrice),
  images: p.images,
  categoryId: p.categoryId,
  aromaLevel: p.aromaLevel,
  size: p.size,
  scent: opt(p.scent),
  waxType: opt(p.waxType),
  burnTime: opt(p.burnTime),
  isNew: p.isNew,
  isFeatured: p.isFeatured,
  rating: p.rating,
  reviewCount: p.reviewCount,
});

const toCategory = (c: Category) => ({
  id: c.id,
  name: c.nameVi,
  nameEn: c.nameEn,
});

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách sản phẩm cho trang Sản phẩm: nổi bật trước, rồi mới tạo trước. Danh mục: theo thứ tự ở BO, chỉ danh mục đang có sản phẩm
  async products() {
    const rows = await this.prisma.product.findMany({
      where: { status: 'active', category: { hidden: false } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
    const used = new Set(rows.map((p) => p.categoryId));
    const categories = await this.prisma.category.findMany({
      where: { id: { in: [...used] } },
      orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }],
    });
    return {
      categories: categories.map(toCategory),
      products: rows.map(toProduct),
    };
  }

  // Liên hệ trên web (nút "Liên hệ đặt nến" mở Zalo): lấy từ Cài đặt › Người gửi. Chưa lưu Cài đặt thì dùng mặc định, SĐT rỗng
  async contact() {
    const row = await this.prisma.shopSettings.findUnique({
      where: { id: 'shop' },
      select: { senderName: true, senderPhone: true },
    });
    return {
      name: row?.senderName || '2510 Candle',
      phone: row?.senderPhone ?? '',
    };
  }
}

@ApiTags('shop')
@Public()
@Controller('shop')
export class ShopController {
  constructor(private readonly shop: ShopService) {}

  @Get('products')
  products() {
    return this.shop.products();
  }

  @Get('contact')
  contact() {
    return this.shop.contact();
  }
}

@Module({ controllers: [ShopController], providers: [ShopService] })
export class ShopModule {}
