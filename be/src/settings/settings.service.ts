// Cài đặt cửa hàng (một bản ghi "shop" + phương thức giao + đơn vị vận chuyển), trả đúng dạng ShopSettings của BO
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SettingsDto } from './settings.dto.js';

const ID = 'shop';

// Giá trị mặc định giống BO (bo/src/lib/settings/types.ts) — dùng khi DB chưa có cài đặt
const DEFAULT_OPTIONS = [
  { id: 'standard', name: 'Tiêu chuẩn', fee: 0, days: 3, enabled: true },
  { id: 'express', name: 'Nhanh', fee: 50_000, days: 1, enabled: true },
];
const DEFAULT_CARRIERS = [
  { id: 'ghn', name: 'Giao Hàng Nhanh', trackingUrl: 'https://donhang.ghn.vn/?order_code={code}', requireCode: true, enabled: true },
  { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm', trackingUrl: 'https://i.ghtk.vn/{code}', requireCode: true, enabled: true },
  { id: 'viettelpost', name: 'Viettel Post', requireCode: true, enabled: true },
  { id: 'jt', name: 'J&T Express', requireCode: true, enabled: true },
  { id: 'self', name: 'Shop tự giao', requireCode: false, enabled: true },
];

// Tên trùng (không phân biệt hoa thường, bỏ khoảng trắng đầu cuối)
const hasDuplicateNames = (list: { name: string }[]) => {
  const names = list.map((x) => x.name.trim().toLowerCase());
  return new Set(names).size !== names.length;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SettingsDto> {
    let row = await this.prisma.shopSettings.findUnique({ where: { id: ID } });
    if (!row) {
      // Lần đầu: tạo cài đặt mặc định
      row = await this.prisma.$transaction(async (tx) => {
        if (!(await tx.shippingOption.count())) await tx.shippingOption.createMany({ data: DEFAULT_OPTIONS.map((o, i) => ({ ...o, sortOrder: i })) });
        if (!(await tx.carrier.count())) await tx.carrier.createMany({ data: DEFAULT_CARRIERS.map((c, i) => ({ ...c, sortOrder: i })) });
        return tx.shopSettings.create({ data: { id: ID } });
      });
    }
    const [options, carriers] = await Promise.all([
      this.prisma.shippingOption.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.carrier.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);
    return {
      depositPercent: row.depositPercent,
      maxDeliveryAttempts: row.maxDeliveryAttempts,
      resendFee: row.resendFee,
      dailyCapacity: row.dailyCapacity,
      leadDays: row.leadDays,
      minMargin: row.minMargin,
      priceMarkup: row.priceMarkup,
      sender: { name: row.senderName, phone: row.senderPhone, address: row.senderAddress },
      shippingOptions: options.map(({ id, name, fee, days, enabled }) => ({ id, name, fee, days, enabled })),
      carriers: carriers.map(({ id, name, trackingUrl, requireCode, enabled }) => ({ id, name, ...(trackingUrl ? { trackingUrl } : {}), requireCode, enabled })),
    };
  }

  // Lưu toàn bộ cài đặt; đơn đã tạo giữ giá trị lúc tạo nên không bị ảnh hưởng
  async save(dto: SettingsDto) {
    if (!dto.shippingOptions.some((o) => o.enabled)) throw new BadRequestException('Cần ít nhất một phương thức đang dùng.');
    if (hasDuplicateNames(dto.shippingOptions)) throw new BadRequestException('Tên phương thức bị trùng.');
    if (!dto.carriers.some((c) => c.enabled)) throw new BadRequestException('Cần ít nhất một đơn vị đang dùng.');
    if (hasDuplicateNames(dto.carriers)) throw new BadRequestException('Tên đơn vị bị trùng.');
    const data = {
      depositPercent: dto.depositPercent,
      maxDeliveryAttempts: dto.maxDeliveryAttempts,
      resendFee: dto.resendFee,
      dailyCapacity: dto.dailyCapacity,
      leadDays: dto.leadDays,
      minMargin: dto.minMargin,
      priceMarkup: dto.priceMarkup,
      senderName: dto.sender.name.trim(),
      senderPhone: dto.sender.phone.trim(),
      senderAddress: dto.sender.address.trim(),
    };
    await this.prisma.$transaction([
      this.prisma.shopSettings.upsert({ where: { id: ID }, create: { id: ID, ...data }, update: data }),
      this.prisma.shippingOption.deleteMany(),
      this.prisma.shippingOption.createMany({ data: dto.shippingOptions.map((o, i) => ({ id: o.id, name: o.name.trim(), fee: o.fee, days: o.days, enabled: o.enabled, sortOrder: i })) }),
      this.prisma.carrier.deleteMany(),
      this.prisma.carrier.createMany({
        data: dto.carriers.map((c, i) => ({ id: c.id, name: c.name.trim(), trackingUrl: c.trackingUrl?.trim() || null, requireCode: c.requireCode, enabled: c.enabled, sortOrder: i })),
      }),
    ]);
    return this.get();
  }
}
