// API nhóm 1: cài đặt, danh mục, khách, mã giảm giá — chạy trên DB thật, schema bo_test
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

const settings = (over: object = {}) => ({
  depositPercent: 40,
  maxDeliveryAttempts: 2,
  resendFee: 25000,
  dailyCapacity: 15,
  leadDays: 2,
  minMargin: 45,
  priceMarkup: 2.2,
  sender: { name: '2510 Candle', phone: '0988 777 666', address: '25 Hàng Bạc' },
  shippingOptions: [
    { id: 'standard', name: 'Tiêu chuẩn', fee: 30000, days: 3, enabled: true },
    { id: 'inner', name: 'Nội thành', fee: 15000, days: 1, enabled: false },
  ],
  carriers: [{ id: 'ghn', name: 'Giao Hàng Nhanh', trackingUrl: 'https://donhang.ghn.vn/?order_code={code}', requireCode: true, enabled: true }],
  ...over,
});

describe('Chưa đăng nhập', () => {
  it('mọi API admin bị chặn', async () => {
    for (const url of ['/api/admin/settings', '/api/admin/categories', '/api/admin/customers', '/api/admin/discounts']) await t.anon().get(url).expect(401);
  });
});

describe('Cài đặt', () => {
  it('lần đầu trả mặc định giống BO', async () => {
    const r = await t.get('/api/admin/settings').expect(200);
    expect(r.body).toMatchObject({ depositPercent: 50, maxDeliveryAttempts: 3, sender: { name: '2510 Candle' } });
    expect(r.body.shippingOptions.map((o: { id: string }) => o.id)).toEqual(['standard', 'express']);
    expect(r.body.carriers.map((c: { id: string }) => c.id)).toEqual(['ghn', 'ghtk', 'viettelpost', 'jt', 'self']);
    expect(r.body.carriers[2].trackingUrl).toBeUndefined();
  });

  it('lưu rồi đọc lại đúng, giữ thứ tự', async () => {
    await t.put('/api/admin/settings', settings()).expect(200);
    const r = await t.get('/api/admin/settings').expect(200);
    // Không gửi mạng xã hội thì danh sách giữ nguyên (đang trống)
    expect(r.body).toEqual({ ...settings(), socials: [] });
  });

  it('chặn: tắt hết phương thức, tên trùng, link thiếu {code}, mức cọc ngoài 1–99', async () => {
    await t.put('/api/admin/settings', settings({ shippingOptions: [{ id: 'a', name: 'A', fee: 0, days: 1, enabled: false }] })).expect(400);
    await t
      .put('/api/admin/settings', settings({ shippingOptions: [{ id: 'a', name: 'Nhanh', fee: 0, days: 1, enabled: true }, { id: 'b', name: ' nhanh ', fee: 0, days: 1, enabled: true }] }))
      .expect(400);
    await t.put('/api/admin/settings', settings({ carriers: [{ id: 'x', name: 'X', trackingUrl: 'https://x.vn/track', requireCode: true, enabled: true }] })).expect(400);
    await t.put('/api/admin/settings', settings({ depositPercent: 100 })).expect(400);
  });
});

describe('Danh mục', () => {
  it('tạo mã từ tên, chặn tên trùng (không dấu), sửa, sắp xếp', async () => {
    const a = await t.post('/api/admin/categories', { name: { vi: 'Nước hoa', en: 'Perfume' }, color: 'purple' }).expect(201);
    expect(a.body).toEqual({ id: 'nuoc-hoa', name: { vi: 'Nước hoa', en: 'Perfume' }, color: 'purple', hidden: false });
    await t.post('/api/admin/categories', { name: { vi: 'nuoc HOA', en: '' } }).expect(409);
    const b = await t.post('/api/admin/categories', { name: { vi: 'Trái cây', en: '' } }).expect(201);
    expect(b.body.name.en).toBe('Trái cây');
    await t.patch('/api/admin/categories/nuoc-hoa', { hidden: true }).expect(200);
    await t.put('/api/admin/categories/order', { ids: ['trai-cay', 'nuoc-hoa'] }).expect(200);
    const list = await t.get('/api/admin/categories').expect(200);
    expect(list.body.map((c: { id: string; hidden: boolean }) => [c.id, c.hidden])).toEqual([
      ['trai-cay', false],
      ['nuoc-hoa', true],
    ]);
    await t.put('/api/admin/categories/order', { ids: ['trai-cay'] }).expect(409);
  });

  it('không xóa được khi còn sản phẩm, xóa được khi trống', async () => {
    await t.post('/api/admin/categories', { name: { vi: 'Nước hoa', en: '' } }).expect(201);
    await t.prisma.product.create({ data: { id: 'p1', name: 'P1', slug: 'p1', price: 1, categoryId: 'nuoc-hoa', aromaLevel: 'soft', size: 'small' } });
    const r = await t.del('/api/admin/categories/nuoc-hoa').expect(409);
    expect(r.body.message).toContain('còn 1 sản phẩm');
    await t.prisma.product.delete({ where: { id: 'p1' } });
    await t.del('/api/admin/categories/nuoc-hoa').expect(204);
    await t.del('/api/admin/categories/nuoc-hoa').expect(404);
  });
});

describe('Khách hàng', () => {
  it('tạo, chặn trùng số điện thoại (bỏ khoảng trắng), sửa nhãn, chặn rồi bỏ chặn', async () => {
    const c = await t.post('/api/admin/customers', { name: 'Ngô Thanh Vy', phone: '0944 889 900' }).expect(201);
    expect(c.body).toMatchObject({ id: 'cus-889900', email: '', tags: [], blocked: false });
    const dup = await t.post('/api/admin/customers', { name: 'Khác', phone: '0944889900' }).expect(409);
    expect(dup.body.customerId).toBe('cus-889900');
    await t.patch('/api/admin/customers/cus-889900', { tags: ['Khách sỉ', ' Khách sỉ ', ''], note: 'Hay mua quà' }).expect(200);
    const blocked = await t.patch('/api/admin/customers/cus-889900', { blocked: true, blockReason: 'Bom hàng 2 lần' }).expect(200);
    expect(blocked.body).toMatchObject({ tags: ['Khách sỉ'], note: 'Hay mua quà', blocked: true, blockReason: 'Bom hàng 2 lần' });
    const open = await t.patch('/api/admin/customers/cus-889900', { blocked: false }).expect(200);
    expect(open.body.blockReason).toBeUndefined();
    await t.post('/api/admin/customers', { name: 'X', phone: '12' }).expect(400);
    await t.patch('/api/admin/customers/khong-co', { note: 'x' }).expect(404);
  });
});

describe('Mã giảm giá', () => {
  const code = (over: object = {}) => ({ code: 'tết 2027', type: 'percent', value: 20, maxDiscount: 300000, scope: 'products', firstOrderOnly: false, startsAt: '2026-11-01', active: true, ...over });

  it('chuẩn hóa mã, chặn trùng, sửa giữ lượt dùng, mã riêng, tạm dừng, xóa', async () => {
    await t.post('/api/admin/customers', { id: 'cus-vy', name: 'Vy', phone: '0944889900' }).expect(201);
    const d = await t.post('/api/admin/discounts', code({ id: 'tet', customerIds: ['cus-vy'] })).expect(201);
    expect(d.body).toMatchObject({ id: 'tet', code: 'TET2027', used: 0, customerIds: ['cus-vy'] });
    await t.post('/api/admin/discounts', code({ code: 'TET-2027' })).expect(409);
    await t.patch('/api/admin/discounts/tet', { used: 3 }).expect(200);
    const edited = await t.put('/api/admin/discounts/tet', code({ value: 80, customerIds: [] })).expect(200);
    expect(edited.body).toMatchObject({ value: 80, used: 3 });
    expect(edited.body.customerIds).toBeUndefined();
    const paused = await t.patch('/api/admin/discounts/tet', { active: false }).expect(200);
    expect(paused.body.active).toBe(false);
    await t.del('/api/admin/discounts/tet').expect(204);
    expect((await t.get('/api/admin/discounts').expect(200)).body).toEqual([]);
  });

  it('quy tắc: mã 4–20 ký tự, % 1–100, giảm tiền < đơn tối thiểu, ngày kết thúc sau ngày bắt đầu, khách phải có', async () => {
    await t.post('/api/admin/discounts', code({ code: 'ab' })).expect(400);
    await t.post('/api/admin/discounts', code({ value: 120 })).expect(400);
    await t.post('/api/admin/discounts', code({ type: 'fixed', value: 50000, minOrder: 50000 })).expect(400);
    await t.post('/api/admin/discounts', code({ endsAt: '2026-10-01' })).expect(400);
    await t.post('/api/admin/discounts', code({ customerIds: ['khong-co'] })).expect(400);
    const fs = await t.post('/api/admin/discounts', code({ code: 'FREESHIP', type: 'freeship', value: 9 })).expect(201);
    expect(fs.body.value).toBe(0);
    expect(fs.body.maxDiscount).toBeUndefined();
  });
});
