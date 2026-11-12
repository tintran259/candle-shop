// API công khai cho web bán hàng (fe) — không cần đăng nhập, chỉ đọc (docs/api.md#web-bán-hàng).
// Chỉ trả sản phẩm Đang bán thuộc danh mục không ẩn, và chỉ những trường khách được xem: không có công thức (recipe),
// lựa chọn Thủ công (build), số đã bán hay trạng thái. Liên hệ: tên shop + SĐT người gửi ở Cài đặt (không trả địa chỉ lấy hàng)
import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard.js';
import type { Category, Concept, Product } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { dayOf, inSeason, sellableNow, todayVN } from '../concepts/season.js';
import { resolveTheme, type ThemeRow } from '../site-theme/theme.js';
import { socialLabel } from '../settings/socials.js';

const opt = <T>(v: T | null) => v ?? undefined;

const toProduct = (p: Product & { concepts: { id: string }[] }) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: opt(p.description),
  price: p.price,
  salePrice: opt(p.salePrice),
  images: p.images,
  categoryId: p.categoryId,
  conceptIds: p.concepts.map((c) => c.id),
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

// Kèm thời gian (YYYY-MM-DD hoặc null) để trang chi tiết ghi "bán đến hết …"
const toConcept = (c: Concept) => ({
  id: c.id,
  name: c.nameVi,
  nameEn: c.nameEn,
  startsOn: dayOf(c.startsOn),
  endsOn: dayOf(c.endsOn),
});

const toCategory = (c: Category) => ({
  id: c.id,
  name: c.nameVi,
  nameEn: c.nameEn,
});

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách sản phẩm cho trang Sản phẩm: nổi bật trước, rồi mới tạo trước. Danh mục: theo thứ tự ở BO, chỉ danh mục đang có sản phẩm.
  // Mùa (season.ts): sản phẩm có concept hiện nhưng không concept nào đang trong mùa thì không trả (đóng bán).
  // conceptIds chỉ gồm concept hiện đang trong mùa; concept ẩn không trả
  async products() {
    const today = todayVN();
    const all = await this.prisma.product.findMany({
      where: { status: 'active', category: { hidden: false } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: {
        concepts: {
          select: { id: true, hidden: true, startsOn: true, endsOn: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const rows = all
      .filter((p) => sellableNow(p.concepts, today))
      .map((p) => ({
        ...p,
        concepts: p.concepts.filter((c) => !c.hidden && inSeason(c, today)),
      }));
    const used = new Set(rows.map((p) => p.categoryId));
    const categories = await this.prisma.category.findMany({
      where: { id: { in: [...used] } },
      orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }],
    });
    // Concept cho hàng lọc: mọi concept hiện chưa kết thúc — kể cả chưa có mẫu / chưa tới mùa (web báo "chưa có mẫu" hoặc đếm ngược tới ngày mở bán)
    const concepts = await this.prisma.concept.findMany({
      where: { hidden: false, OR: [{ endsOn: null }, { endsOn: { gte: new Date(`${today}T00:00:00.000Z`) } }] },
      orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }],
    });
    return {
      categories: categories.map(toCategory),
      concepts: concepts.map(toConcept),
      products: rows.map(toProduct),
    };
  }

  // Trang chủ: giao diện đã ghép theo mùa (site-theme/theme.ts) + mẫu cho khối Xưởng nến (mẫu chọn ở giao diện, tối đa 12; chưa đủ 3 thì bù mẫu nổi bật rồi mẫu khác).
  // Chưa cấu hình giao diện thì theme rỗng — web dùng nội dung có sẵn
  async home() {
    const [themes, concepts, shop] = await Promise.all([
      this.prisma.siteTheme.findMany({ select: { id: true, published: true } }),
      this.prisma.concept.findMany({ orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }], select: { id: true, hidden: true, startsOn: true, endsOn: true } }),
      this.products(),
    ]);
    const theme = resolveTheme(themes as ThemeRow[], concepts, todayVN());
    // Xưởng nến: mẫu chọn ở giao diện (đang bán, đúng mùa) theo thứ tự — đủ 3 thì trả hết (tối đa 12, web chạy băng chuyền khi hơn 3),
    // thiếu thì bù mẫu nổi bật rồi mẫu khác cho đủ 3
    const picked = (theme.collection.productIds ?? []).map((id) => shop.products.find((p) => p.id === id)).filter((p) => !!p);
    const rest = shop.products.filter((p) => !picked.includes(p));
    const featured = picked.length >= 3 ? picked : [...picked, ...rest.filter((p) => p.isFeatured), ...rest.filter((p) => !p.isFeatured)].slice(0, 3);
    return {
      theme,
      featured,
      categories: shop.categories.filter((c) => featured.some((p) => p.categoryId === c.id)),
    };
  }

  // Liên hệ trên web (nút "Liên hệ đặt nến" mở Zalo): lấy từ Cài đặt › Người gửi. Chưa lưu Cài đặt thì dùng mặc định, SĐT rỗng
  // Mạng xã hội đang bật (theo thứ tự ở Cài đặt) cho chân trang: tên hiện trống thì tên nền tảng
  async contact() {
    const [row, socials] = await Promise.all([
      this.prisma.shopSettings.findUnique({ where: { id: 'shop' }, select: { senderName: true, senderPhone: true } }),
      this.prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    return {
      name: row?.senderName || '2510 Candle',
      phone: row?.senderPhone ?? '',
      socials: socials.map((s) => ({ platform: s.platform, label: socialLabel(s), url: s.url })),
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

  @Get('home')
  home() {
    return this.shop.home();
  }

  @Get('contact')
  contact() {
    return this.shop.contact();
  }
}

@Module({ controllers: [ShopController], providers: [ShopService] })
export class ShopModule {}
