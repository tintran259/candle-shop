// API nhóm 3: cấu hình Thủ công (bản đã lưu, bản nháp, Lưu lên web), sản phẩm hủy đơn — DB thật, schema bo_test
import { DEFAULT_CRAFT } from '../src/craft/default-config.js';
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

const name = (vi: string) => ({ vi, en: vi });
// Cấu hình nhỏ: hũ 1 cỡ (gắn Kho), sáp chọn nhiều, bước cá nhân hóa
const config = (wax = 'wax-new') => ({
  version: 1,
  currency: 'VND',
  steps: [
    {
      id: 'vessel',
      kind: 'vessel',
      title: name('Hũ'),
      icon: 'vessel',
      enabled: true,
      required: true,
      options: [
        {
          id: 'gom',
          name: name('Hũ gốm'),
          priceDelta: 90000,
          available: true,
          shape: 'jar',
          lid: null,
          sizes: [{ id: 's150', ml: 150, grams: 120, priceDelta: 0, available: true, materialId: 'jar-150' }],
        },
      ],
    },
    {
      id: 'wax',
      kind: 'cards',
      title: name('Sáp'),
      icon: 'layers',
      enabled: true,
      required: true,
      multiple: true,
      options: [{ id: 'soy', name: name('Sáp đậu nành'), priceDelta: 0, unitPrice: 18000, available: true, materialId: wax }],
    },
    {
      id: 'personal',
      kind: 'inputs',
      title: name('Cá nhân hóa'),
      icon: 'pen',
      enabled: true,
      required: false,
      fields: [{ id: 'name', label: name('Tên'), maxLength: 20, priceDelta: 20000, enabled: true }],
      addons: [],
    },
  ],
});
const pending = (id: string) => ({ id, name: `NL ${id}`, category: 'wax', unit: 'g', tracked: true, stock: 1000 });

describe('Thủ công', () => {
  it('chưa lưu lần nào: trả cấu hình mẫu (hợp lệ), chưa có nháp', async () => {
    const r = await t.get('/api/admin/craft').expect(200);
    expect(r.body).toMatchObject({ isDefault: true, draft: null, pendingMaterials: [] });
    expect(r.body.saved.steps.length).toBe(DEFAULT_CRAFT.steps.length);
    await t.put('/api/admin/craft/draft', { config: r.body.saved }).expect(200);
  });

  it('bản nháp: lưu kèm nguyên liệu chờ tạo, bỏ nháp', async () => {
    const d = await t.put('/api/admin/craft/draft', { config: { ...config(), updatedAt: 'bo-qua' }, pendingMaterials: [pending('wax-new')] }).expect(200);
    expect(d.body.draft.steps.map((s: { id: string }) => s.id)).toEqual(['vessel', 'wax', 'personal']);
    expect(d.body.draft.updatedAt).not.toBe('bo-qua');
    expect(d.body.pendingMaterials).toEqual([expect.objectContaining({ id: 'wax-new', stock: 1000 })]);
    expect(await t.prisma.material.count()).toBe(0); // chưa vào Kho
    const x = await t.del('/api/admin/craft/draft').expect(200);
    expect(x.body.draft).toBeNull();
  });

  it('chặn cấu hình hỏng: sai phiên bản, trùng id bước, lựa chọn thiếu tên, hũ không có cỡ, nguyên liệu chờ thiếu id', async () => {
    const c = config();
    await t.put('/api/admin/craft/draft', { config: { ...c, version: 2 } }).expect(400);
    expect((await t.put('/api/admin/craft/draft', { config: { ...c, steps: [c.steps[1], c.steps[1]] } }).expect(400)).body.message).toContain('trùng');
    await t.put('/api/admin/craft/draft', { config: { ...c, steps: [{ ...c.steps[1], options: [{ id: 'x', priceDelta: 0, available: true }] }] } }).expect(400);
    expect((await t.put('/api/admin/craft/draft', { config: { ...c, steps: [{ ...c.steps[0], options: [{ ...c.steps[0].options![0], sizes: [] }] }] } }).expect(400)).body.message).toContain(
      'ít nhất một cỡ',
    );
    await t.put('/api/admin/craft/draft', { config: c, pendingMaterials: [{ ...pending('a'), id: undefined }] }).expect(400);
  });

  it('Lưu lên web: chỉ tạo nguyên liệu chờ mà cấu hình còn dùng, báo mã Kho không có, xóa nháp', async () => {
    await t.put('/api/admin/craft/draft', { config: config(), pendingMaterials: [pending('wax-new'), pending('wax-unused')] }).expect(200);
    const r = await t.post('/api/admin/craft/publish', { config: config(), pendingMaterials: [pending('wax-new'), pending('wax-unused')] }).expect(200);
    expect(r.body.createdMaterials.map((m: { id: string }) => m.id)).toEqual(['wax-new']);
    expect(r.body.missingMaterials).toEqual(['jar-150']);
    const mv = await t.get('/api/admin/stock-movements?materialId=wax-new').expect(200);
    expect(mv.body[0]).toMatchObject({ note: 'Tồn ban đầu', change: 1000 });
    const g = await t.get('/api/admin/craft').expect(200);
    expect(g.body).toMatchObject({ isDefault: false, draft: null });
    expect(g.body.saved.steps[1].options[0].materialId).toBe('wax-new');
    // Lưu lại lần nữa: nguyên liệu đã có thì không tạo lại
    expect((await t.post('/api/admin/craft/publish', { config: config(), pendingMaterials: [pending('wax-new')] }).expect(200)).body.createdMaterials).toEqual([]);
  });
});

describe('Sản phẩm hủy đơn', () => {
  const record = (id: string, cancelledAt: string) => ({
    id,
    name: 'Nến tự phối',
    custom: 'Hũ gốm 150ml · Sáp đậu nành',
    recipe: [{ materialId: 'soy', quantity: 120 }],
    personalized: false,
    images: [],
    price: 320000,
    quantity: 2,
    orderId: 'o1',
    orderCode: 'DH-0001',
    customerName: 'Vy',
    cancelReason: 'Khách đổi ý',
    cancelledAt: new Date(cancelledAt),
    updatedAt: new Date(cancelledAt),
  });

  it('danh sách mới hủy trước; bỏ; tạo sản phẩm trưng bày phải trỏ tới sản phẩm có thật; đặt lại chưa xử lý thì bỏ liên kết', async () => {
    await t.prisma.cancelledProduct.createMany({ data: [record('c1', '2026-11-01'), record('c2', '2026-11-05')] });
    const list = await t.get('/api/admin/cancelled-products').expect(200);
    expect(list.body.map((c: { id: string }) => c.id)).toEqual(['c2', 'c1']);
    expect(list.body[0]).toMatchObject({ status: 'pending', recipe: [{ materialId: 'soy', quantity: 120 }], quantity: 2 });
    expect((await t.patch('/api/admin/cancelled-products/c1', { status: 'discarded' }).expect(200)).body.status).toBe('discarded');
    await t.patch('/api/admin/cancelled-products/c2', { status: 'converted' }).expect(400);
    await t.patch('/api/admin/cancelled-products/c2', { status: 'converted', displayProductId: 'khong-co' }).expect(400);
    await t.post('/api/admin/categories', { id: 'fruit', name: { vi: 'Trái cây', en: '' } }).expect(201);
    await t
      .post('/api/admin/products', { name: 'Nến tự phối', price: 320000, images: ['a.jpg'], categoryId: 'fruit', aromaLevel: 'soft', size: 'small', status: 'active', isNew: true, isFeatured: false })
      .expect(201);
    const c = await t.patch('/api/admin/cancelled-products/c2', { status: 'converted', displayProductId: 'nen-tu-phoi' }).expect(200);
    expect(c.body).toMatchObject({ status: 'converted', displayProductId: 'nen-tu-phoi' });
    const back = await t.patch('/api/admin/cancelled-products/c2', { status: 'pending' }).expect(200);
    expect(back.body.displayProductId).toBeUndefined();
    await t.patch('/api/admin/cancelled-products/khong-co', { status: 'discarded' }).expect(404);
    await t.patch('/api/admin/cancelled-products/c1', { status: 'sold' }).expect(400);
  });
});
