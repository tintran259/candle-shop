// API công khai cho web bán hàng: không cần đăng nhập, chỉ sản phẩm Đang bán ở danh mục không ẩn, không lộ công thức / lựa chọn / số đã bán
import { createTestApp, resetDb } from './app.js';

type T = Awaited<ReturnType<typeof createTestApp>>;
let t: T;

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(async () => {
  await resetDb(t.prisma);
});
afterAll(async () => {
  await t.app.close();
});

const product = (id: string, over: object = {}) => ({
  id,
  name: id,
  slug: id,
  price: 250000,
  images: [`https://res.cloudinary.com/demo/image/upload/${id}.jpg`],
  aromaLevel: 'medium' as const,
  size: 'small' as const,
  categoryId: 'thu-gian',
  ...over,
});

it('GET /api/shop/products: không cần token, lọc sản phẩm ẩn / danh mục ẩn, chỉ trả trường công khai, nổi bật trước', async () => {
  await t.prisma.category.createMany({
    data: [
      { id: 'thu-gian', nameVi: 'Thư giãn', nameEn: 'Relax', sortOrder: 2 },
      { id: 'qua-tang', nameVi: 'Quà tặng', nameEn: 'Gift', sortOrder: 1 },
      { id: 'an', nameVi: 'Danh mục ẩn', nameEn: 'Hidden', hidden: true },
      { id: 'trong', nameVi: 'Chưa có sản phẩm', nameEn: 'Empty' },
    ],
  });
  await t.prisma.material.create({
    data: { id: 'sap', name: 'Sáp', category: 'wax', unit: 'g' },
  });
  await t.prisma.product.create({
    data: {
      ...product('cu', { createdAt: new Date('2026-01-01') }),
      sold: 12,
      build: { selection: {} },
      recipe: { create: [{ materialId: 'sap', quantity: 120 }] },
    },
  });
  await t.prisma.product.create({
    data: product('noi-bat', {
      isFeatured: true,
      categoryId: 'qua-tang',
      createdAt: new Date('2025-06-01'),
      salePrice: 199000,
    }),
  });
  await t.prisma.product.create({
    data: product('moi', { isNew: true, createdAt: new Date('2026-03-01') }),
  });
  await t.prisma.product.create({
    data: product('tam-an', { status: 'hidden' }),
  });
  await t.prisma.product.create({
    data: product('o-danh-muc-an', { categoryId: 'an' }),
  });

  const r = await t.anon().get('/api/shop/products').expect(200);
  expect(r.body.products.map((p: { id: string }) => p.id)).toEqual(['noi-bat', 'moi', 'cu']);
  expect(r.body.categories).toEqual([
    { id: 'qua-tang', name: 'Quà tặng', nameEn: 'Gift' },
    { id: 'thu-gian', name: 'Thư giãn', nameEn: 'Relax' },
  ]);
  const cu = r.body.products[2];
  expect(cu).toMatchObject({
    name: 'cu',
    price: 250000,
    aromaLevel: 'medium',
    size: 'small',
    categoryId: 'thu-gian',
    isNew: false,
  });
  for (const k of ['recipe', 'build', 'sold', 'status', 'createdAt']) expect(cu).not.toHaveProperty(k);
  expect(r.body.products[0].salePrice).toBe(199000);
});

it('GET /api/shop/contact: tên shop + SĐT người gửi ở Cài đặt, không có địa chỉ; chưa lưu Cài đặt thì SĐT rỗng', async () => {
  expect((await t.anon().get('/api/shop/contact').expect(200)).body).toEqual({
    name: '2510 Candle',
    phone: '',
    socials: [],
  });
  await t.prisma.shopSettings.create({
    data: {
      id: 'shop',
      senderName: 'Nến 2510',
      senderPhone: '0901 234 567',
      senderAddress: '12 Đường Riêng, Quận 1',
    },
  });
  expect((await t.anon().get('/api/shop/contact').expect(200)).body).toEqual({
    name: 'Nến 2510',
    phone: '0901 234 567',
    socials: [],
  });
});

it('Mạng xã hội: lưu ở Cài đặt (thứ tự, tên hiện trống = tên nền tảng), web chỉ nhận mạng đang bật; link phải https, nền tảng lạ / quá 10 mạng → 400; không gửi socials thì giữ nguyên', async () => {
  const settings = (await t.get('/api/admin/settings').expect(200)).body;
  expect(settings.socials).toEqual([]);
  const socials = [
    { id: 's1', platform: 'instagram', label: '', url: 'https://instagram.com/2510candle', enabled: true },
    { id: 's2', platform: 'facebook', label: 'Fanpage 2510', url: 'https://facebook.com/2510candle', enabled: true },
    { id: 's3', platform: 'tiktok', label: '', url: 'https://tiktok.com/@2510candle', enabled: false },
  ];
  const saved = (await t.put('/api/admin/settings', { ...settings, socials }).expect(200)).body;
  expect(saved.socials).toEqual(socials);
  expect((await t.anon().get('/api/shop/contact').expect(200)).body.socials).toEqual([
    { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/2510candle' },
    { platform: 'facebook', label: 'Fanpage 2510', url: 'https://facebook.com/2510candle' },
  ]);

  const bad = async (list: object[]) => JSON.stringify((await t.put('/api/admin/settings', { ...settings, socials: list }).expect(400)).body.message);
  expect(await bad([{ ...socials[0], url: 'http://instagram.com/x' }])).toContain('Link mạng xã hội phải bắt đầu bằng https://');
  expect(await bad([{ ...socials[0], platform: 'myspace' }])).toContain('Nền tảng không hợp lệ.');
  expect(await bad(Array.from({ length: 11 }, (_, i) => ({ ...socials[0], id: `x${i}` })))).toContain('Tối đa 10 mạng xã hội.');

  // BO cũ không gửi socials: giữ nguyên
  const { socials: _drop, ...old } = settings;
  await t.put('/api/admin/settings', old).expect(200);
  expect((await t.get('/api/admin/settings').expect(200)).body.socials).toHaveLength(3);
});
