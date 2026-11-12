// Sản phẩm trưng bày (docs/pages/products.md). Trả đúng dạng Product của BO (bo/src/lib/products/types.ts).
// Không có số tồn thành phẩm: công thức trỏ tới nguyên liệu trong Kho. Đánh giá, số đã bán do hệ thống cập nhật, không sửa ở đây
import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { slugify } from '../common/text.js';
import { Prisma, type Product, type ProductRecipeLine } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BulkPatchDto, IdsDto, ProductDto } from './products.dto.js';

// Kèm công thức và concept (chỉ id, theo thứ tự ở trang Concept)
const withRecipe = { recipe: { orderBy: { sortOrder: 'asc' } }, concepts: { select: { id: true }, orderBy: { sortOrder: 'asc' } } } as const;
type Row = Product & { recipe: ProductRecipeLine[]; concepts: { id: string }[] };
const opt = <T>(v: T | null) => v ?? undefined;

const toDto = (p: Row) => ({
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
  ...(p.recipe.length && { recipe: p.recipe.map((r) => ({ materialId: r.materialId, quantity: r.quantity })) }),
  build: opt(p.build),
  status: p.status,
  isNew: p.isNew,
  isFeatured: p.isFeatured,
  rating: p.rating,
  reviewCount: p.reviewCount,
  sold: p.sold,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.product.findMany({ include: withRecipe, orderBy: { createdAt: 'desc' } })).map(toDto);
  }

  async get(id: string) {
    const row = await this.prisma.product.findUnique({ where: { id }, include: withRecipe });
    if (!row) throw new NotFoundException('Không tìm thấy sản phẩm.');
    return toDto(row);
  }

  // Quy tắc giống drawer: slug không trùng, giá giảm thấp hơn giá bán, danh mục có thật, công thức trỏ tới nguyên liệu có thật
  private async validate(dto: ProductDto, selfId?: string) {
    const slug = slugify(dto.slug || dto.name);
    if (!slug) throw new BadRequestException('Slug chỉ gồm chữ không dấu, số và dấu gạch.');
    const same = await this.prisma.product.findUnique({ where: { slug } });
    if (same && same.id !== selfId) throw new ConflictException(`Slug “${slug}” đã được dùng cho ${same.name}.`);
    if (dto.salePrice && dto.salePrice >= dto.price) throw new BadRequestException('Giá giảm phải thấp hơn giá bán.');
    if (!(await this.prisma.category.findUnique({ where: { id: dto.categoryId } }))) throw new BadRequestException('Danh mục không còn — chọn danh mục khác.');
    const conceptIds = [...new Set(dto.conceptIds ?? [])];
    if (conceptIds.length) {
      const found = await this.prisma.concept.findMany({ where: { id: { in: conceptIds } }, select: { id: true } });
      if (found.length !== conceptIds.length) throw new BadRequestException('Có concept không còn — tải lại trang rồi chọn lại.');
    }
    const recipe = dto.recipe ?? [];
    const ids = recipe.map((r) => r.materialId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Công thức có nguyên liệu bị trùng.');
    if (ids.length) {
      const found = await this.prisma.material.findMany({ where: { id: { in: ids } }, select: { id: true } });
      const missing = ids.filter((x) => !found.some((m) => m.id === x));
      if (missing.length) throw new BadRequestException(`Không có nguyên liệu ${missing.join(', ')} trong Kho.`);
    }
    return { slug, recipe, conceptIds };
  }

  private data(dto: ProductDto, slug: string) {
    return {
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || null,
      price: dto.price,
      salePrice: dto.salePrice || null,
      images: dto.images,
      categoryId: dto.categoryId,
      aromaLevel: dto.aromaLevel,
      size: dto.size,
      scent: dto.scent?.trim() || null,
      waxType: dto.waxType?.trim() || null,
      burnTime: dto.burnTime ?? null,
      build: (dto.build ?? undefined) as Prisma.InputJsonValue | undefined,
      status: dto.status,
      isNew: dto.isNew,
      isFeatured: dto.isFeatured,
    };
  }

  async create(dto: ProductDto) {
    const { slug, recipe, conceptIds } = await this.validate(dto);
    const id = dto.id ?? slug;
    if (await this.prisma.product.findUnique({ where: { id } })) throw new ConflictException('Mã sản phẩm đã tồn tại.');
    const row = await this.prisma.product.create({
      data: {
        id,
        ...this.data(dto, slug),
        recipe: { create: recipe.map((r, i) => ({ materialId: r.materialId, quantity: r.quantity, sortOrder: i })) },
        concepts: { connect: conceptIds.map((c) => ({ id: c })) },
      },
      include: withRecipe,
    });
    return toDto(row);
  }

  // Sửa toàn bộ (drawer sửa). Giữ đánh giá, số đã bán, ngày tạo. Không gửi build thì bỏ build cũ
  async replace(id: string, dto: ProductDto) {
    await this.get(id);
    const { slug, recipe, conceptIds } = await this.validate(dto, id);
    const data = this.data(dto, slug);
    const row = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        build: data.build ?? Prisma.DbNull,
        recipe: { deleteMany: {}, create: recipe.map((r, i) => ({ materialId: r.materialId, quantity: r.quantity, sortOrder: i })) },
        concepts: { set: conceptIds.map((c) => ({ id: c })) },
      },
      include: withRecipe,
    });
    return toDto(row);
  }

  // Bật / tắt bán, nhãn Mới, Nổi bật cho một hoặc nhiều sản phẩm
  async patch(dto: BulkPatchDto) {
    const { ids, ...changes } = dto;
    if (!Object.keys(changes).length) throw new BadRequestException('Không có gì để đổi.');
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: changes });
    return (await this.prisma.product.findMany({ where: { id: { in: ids } }, include: withRecipe, orderBy: { createdAt: 'desc' } })).map(toDto);
  }

  // Xóa một hoặc nhiều. Đơn cũ giữ tên, giá, công thức đã chụp nên không ảnh hưởng
  async remove(ids: string[]) {
    const { count } = await this.prisma.product.deleteMany({ where: { id: { in: ids } } });
    if (!count) throw new NotFoundException('Không tìm thấy sản phẩm.');
    return { deleted: count };
  }
}

@ApiTags('products')
@ApiBearerAuth()
@Controller('admin/products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list() {
    return this.products.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.products.get(id);
  }

  @Post()
  create(@Body() body: ProductDto) {
    return this.products.create(body);
  }

  @Post('delete')
  @HttpCode(200)
  remove(@Body() body: IdsDto) {
    return this.products.remove(body.ids);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() body: ProductDto) {
    return this.products.replace(id, body);
  }

  @Patch()
  patch(@Body() body: BulkPatchDto) {
    return this.products.patch(body);
  }
}

@Module({ controllers: [ProductsController], providers: [ProductsService], exports: [ProductsService] })
export class ProductsModule {}
