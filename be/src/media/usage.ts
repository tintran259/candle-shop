// Ảnh đang được dùng ở đâu: gom mọi nơi lưu URL ảnh trong DB thành danh sách { nhãn, chuỗi ảnh }, rồi so public_id.
// URL Cloudinary dạng ".../upload/v123/candle2510/products/ten-anh.webp" → chứa "/<public_id>." (dấu chấm tránh nhầm "ten-anh" với "ten-anh-2")
import type { PrismaService } from '../prisma/prisma.service.js';

type Source = { label: string; text: string };

type CraftLike = { steps?: { title?: { vi?: string }; options?: { name?: { vi?: string } }[] }[] };

const craftSources = (config: unknown, suffix: string): Source[] =>
  ((config as CraftLike | null)?.steps ?? []).flatMap((s) => (s.options ?? []).map((o) => ({ label: `Thủ công › ${s.title?.vi ?? ''} › ${o.name?.vi ?? ''}${suffix}`, text: JSON.stringify(o) })));

export async function imageSources(prisma: PrismaService): Promise<Source[]> {
  const [products, materials, crafts, items, payments, complaints, refunds, cancelled, themes, drafts] = await Promise.all([
    prisma.product.findMany({ where: { images: { isEmpty: false } }, select: { name: true, images: true } }),
    prisma.material.findMany({ where: { images: { isEmpty: false } }, select: { name: true, images: true } }),
    prisma.craftConfig.findMany({ select: { id: true, config: true } }),
    prisma.orderItem.findMany({ where: { image: { not: null } }, select: { image: true, order: { select: { code: true } } } }),
    prisma.payment.findMany({ where: { images: { isEmpty: false } }, select: { images: true, order: { select: { code: true } } } }),
    prisma.complaint.findMany({ where: { images: { isEmpty: false } }, select: { images: true, order: { select: { code: true } } } }),
    prisma.order.findMany({ where: { refundImages: { isEmpty: false } }, select: { code: true, refundImages: true } }),
    prisma.cancelledProduct.findMany({ where: { images: { isEmpty: false } }, select: { name: true, images: true } }),
    prisma.siteTheme.findMany({ select: { name: true, published: true, draft: true } }),
    prisma.orderDraft.findMany({ select: { values: true } }),
  ]);
  return [
    ...products.map((p) => ({ label: `Sản phẩm: ${p.name}`, text: p.images.join(' ') })),
    ...materials.map((m) => ({ label: `Nguyên liệu: ${m.name}`, text: m.images.join(' ') })),
    ...crafts.flatMap((c) => craftSources(c.config, c.id === 'draft' ? ' (nháp)' : '')),
    ...items.map((i) => ({ label: `Đơn ${i.order.code}`, text: i.image ?? '' })),
    ...payments.map((p) => ({ label: `Đơn ${p.order.code} · thanh toán`, text: p.images.join(' ') })),
    ...complaints.map((c) => ({ label: `Đơn ${c.order.code} · khiếu nại`, text: c.images.join(' ') })),
    ...refunds.map((o) => ({ label: `Đơn ${o.code} · hoàn tiền`, text: o.refundImages.join(' ') })),
    ...cancelled.map((c) => ({ label: `Sản phẩm hủy đơn: ${c.name}`, text: c.images.join(' ') })),
    ...themes.flatMap((t) => [
      { label: `Giao diện web: ${t.name}`, text: JSON.stringify(t.published ?? '') },
      { label: `Giao diện web: ${t.name} (nháp)`, text: JSON.stringify(t.draft ?? '') },
    ]),
    ...drafts.map((d) => ({ label: 'Đơn nháp', text: JSON.stringify(d.values) })),
  ];
}

// Nhãn các nơi đang dùng ảnh (không trùng)
export const usedIn = (sources: Source[], publicId: string) => [...new Set(sources.filter((s) => s.text.includes(`/${publicId}.`)).map((s) => s.label))];
