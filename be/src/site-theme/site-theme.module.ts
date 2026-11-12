// Giao diện web cấu hình ở BO (docs/pages/site-theme.md): danh sách giao diện, "Mặc định" luôn có (id `default`, không xóa được).
// Mỗi giao diện có bản nháp (sửa thoải mái) + bản đã đăng (web dùng) riêng, như Thủ công. Mọi thao tác trả về cả danh sách
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { WebRevalidate } from '../common/web-revalidate.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_THEME, FOCUS, type ThemeContent } from './theme.js';

// Ảnh: URL Cloudinary (https) hoặc data URL khi chưa cấu hình kho ảnh
const IMAGE = /^(https:\/\/|data:image\/)/;
const IMAGE_MAX = 3_000_000;

class LogoDto {
  @IsOptional() @IsString() @Matches(IMAGE, { message: 'Ảnh logo không hợp lệ.' }) @MaxLength(IMAGE_MAX) light?: string;
  @IsOptional() @IsString() @Matches(IMAGE, { message: 'Ảnh logo không hợp lệ.' }) @MaxLength(IMAGE_MAX) dark?: string;
}

class HeroDto {
  @IsOptional() @IsString() @Matches(IMAGE, { message: 'Ảnh hero không hợp lệ.' }) @MaxLength(IMAGE_MAX) image?: string;
  @IsOptional() @IsIn(FOCUS) focus?: (typeof FOCUS)[number];
  @IsOptional() @IsString() @MaxLength(60, { message: 'Nhãn nhỏ tối đa 60 ký tự.' }) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(70) title?: string;
  @IsOptional() @IsString() @MaxLength(220, { message: 'Đoạn giới thiệu tối đa 220 ký tự.' }) text?: string;
  @IsOptional() @IsString() @MaxLength(30, { message: 'Chữ trên nút tối đa 30 ký tự.' }) cta?: string;
  @IsOptional() @IsString() @MaxLength(32, { message: 'Câu lớn tối đa 32 ký tự.' }) mark?: string;
}

export class ThemeContentDto {
  @IsOptional() @IsBoolean() announcementOn?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) conceptIds?: string[];
  @IsOptional() @IsString() @MaxLength(90, { message: 'Thông báo tối đa 90 ký tự.' }) announcement?: string;
  @IsOptional() @ValidateNested() @Type(() => LogoDto) logo?: LogoDto;
  @IsOptional() @ValidateNested() @Type(() => HeroDto) hero?: HeroDto;
}

class CreateThemeDto {
  @IsOptional() @IsString() @Matches(/^[a-z0-9-]{1,60}$/) id?: string;
  @IsString() @IsNotEmpty({ message: 'Nhập tên giao diện.' }) @MaxLength(60) name: string;
}

class RenameThemeDto {
  @IsString() @IsNotEmpty({ message: 'Nhập tên giao diện.' }) @MaxLength(60) name: string;
}

type Row = { id: string; name: string; published: unknown; draft: unknown; publishedAt: Date | null; updatedAt: Date };
const content = (v: unknown) => (v ?? null) as ThemeContent | null;
const toTheme = (r: Row) => ({
  id: r.id,
  name: r.name,
  isDefault: r.id === DEFAULT_THEME,
  published: content(r.published),
  draft: content(r.draft),
  publishedAt: r.publishedAt?.toISOString() ?? null,
  updatedAt: r.updatedAt.toISOString(),
});
// Cột JSON có thể trống: null phải ghi bằng Prisma.DbNull
const json = (v: unknown) => (v == null ? Prisma.DbNull : (v as Prisma.InputJsonValue));

// Tiêu đề hero: tối đa 2 dòng, mỗi dòng 30 ký tự (vừa bố cục trang chủ)
const checkTitle = (c: ThemeContent) => {
  const lines = c.hero?.title?.split('\n') ?? [];
  if (lines.length > 2 || lines.some((l) => l.trim().length > 30)) throw new BadRequestException('Tiêu đề hero tối đa 2 dòng, mỗi dòng 30 ký tự.');
};

@Injectable()
export class SiteThemeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web: WebRevalidate,
  ) {}

  // Mặc định trước, rồi theo ngày tạo. Chưa có Mặc định (DB mới / vừa xóa dữ liệu) thì trả bản trống
  async list() {
    const rows = await this.prisma.siteTheme.findMany({ orderBy: { createdAt: 'asc' } });
    const def = rows.find((r) => r.id === DEFAULT_THEME) ?? { id: DEFAULT_THEME, name: 'Mặc định', published: null, draft: null, publishedAt: null, updatedAt: new Date(0) };
    return [def, ...rows.filter((r) => r.id !== DEFAULT_THEME)].map(toTheme);
  }

  private async find(id: string) {
    if (id === DEFAULT_THEME) return this.prisma.siteTheme.upsert({ where: { id }, create: { id, name: 'Mặc định' }, update: {} });
    const row = await this.prisma.siteTheme.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy giao diện.');
    return row;
  }

  async create(dto: CreateThemeDto) {
    const id = dto.id ?? `theme-${randomUUID().slice(0, 8)}`;
    if (id === DEFAULT_THEME || (await this.prisma.siteTheme.findUnique({ where: { id } }))) throw new BadRequestException('Mã giao diện đã có.');
    await this.prisma.siteTheme.create({ data: { id, name: dto.name.trim() } });
    return this.list();
  }

  async rename(id: string, dto: RenameThemeDto) {
    await this.find(id);
    await this.prisma.siteTheme.update({ where: { id }, data: { name: dto.name.trim() } });
    return this.list();
  }

  async remove(id: string) {
    if (id === DEFAULT_THEME) throw new BadRequestException('Không xóa được giao diện Mặc định.');
    const row = await this.find(id);
    await this.prisma.siteTheme.delete({ where: { id } });
    if (row.published) this.web.siteTheme();
    return this.list();
  }

  // Kiểm tra tiêu đề; Mặc định không gắn concept, giao diện khác không có công tắc thông báo; bỏ concept không còn / trùng;
  // concept đã thuộc giao diện khác (bản nháp hoặc đã đăng) thì báo lỗi
  private async clean(id: string, dto: ThemeContentDto): Promise<ThemeContent> {
    checkTitle(dto);
    const { announcementOn, conceptIds, ...part } = dto;
    if (id === DEFAULT_THEME) return { ...part, ...(announcementOn !== undefined && { announcementOn }) };
    const concepts = await this.prisma.concept.findMany({ select: { id: true, nameVi: true } });
    const ids = [...new Set(conceptIds ?? [])].filter((c) => concepts.some((x) => x.id === c));
    const others = await this.prisma.siteTheme.findMany({ where: { id: { notIn: [id, DEFAULT_THEME] } } });
    for (const o of others) {
      const taken = new Set([...(content(o.published)?.conceptIds ?? []), ...(content(o.draft)?.conceptIds ?? [])]);
      const clash = ids.find((c) => taken.has(c));
      if (clash) throw new BadRequestException(`Concept "${concepts.find((x) => x.id === clash)!.nameVi}" đã thuộc giao diện "${o.name}".`);
    }
    return { ...part, conceptIds: ids };
  }

  async saveDraft(id: string, dto: ThemeContentDto) {
    await this.find(id);
    await this.prisma.siteTheme.update({ where: { id }, data: { draft: json(await this.clean(id, dto)) } });
    return this.list();
  }

  async discardDraft(id: string) {
    await this.find(id);
    await this.prisma.siteTheme.update({ where: { id }, data: { draft: json(null) } });
    return this.list();
  }

  async publish(id: string, dto: ThemeContentDto) {
    await this.find(id);
    const data = json(await this.clean(id, dto));
    await this.prisma.siteTheme.update({ where: { id }, data: { published: data, draft: json(null), publishedAt: new Date() } });
    this.web.siteTheme();
    return this.list();
  }

  // Gỡ khỏi web: bỏ bản đã đăng (giữ nội dung làm bản nháp nếu chưa có nháp). Mặc định không gỡ được
  async unpublish(id: string) {
    if (id === DEFAULT_THEME) throw new BadRequestException('Không gỡ được giao diện Mặc định.');
    const row = await this.find(id);
    await this.prisma.siteTheme.update({ where: { id }, data: { published: json(null), draft: json(row.draft ?? row.published), publishedAt: null } });
    this.web.siteTheme();
    return this.list();
  }
}

@ApiTags('site-theme')
@ApiBearerAuth()
@Controller('admin/site-themes')
export class SiteThemeController {
  constructor(private readonly themes: SiteThemeService) {}

  @Get()
  list() {
    return this.themes.list();
  }

  @Post()
  create(@Body() body: CreateThemeDto) {
    return this.themes.create(body);
  }

  @Patch(':id')
  rename(@Param('id') id: string, @Body() body: RenameThemeDto) {
    return this.themes.rename(id, body);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.themes.remove(id);
  }

  @Put(':id/draft')
  saveDraft(@Param('id') id: string, @Body() body: ThemeContentDto) {
    return this.themes.saveDraft(id, body);
  }

  @Delete(':id/draft')
  @HttpCode(200)
  discardDraft(@Param('id') id: string) {
    return this.themes.discardDraft(id);
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@Param('id') id: string, @Body() body: ThemeContentDto) {
    return this.themes.publish(id, body);
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  unpublish(@Param('id') id: string) {
    return this.themes.unpublish(id);
  }
}

@Module({ controllers: [SiteThemeController], providers: [SiteThemeService, WebRevalidate] })
export class SiteThemeModule {}
