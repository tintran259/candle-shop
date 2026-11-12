// Concept (dịp lễ): thêm / sửa / sắp xếp / xóa (gỡ khỏi sản phẩm), gắn vào sản phẩm (nhiều, không bắt buộc), web chỉ thấy concept không ẩn
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

const product = (over: object = {}) => ({
  name: 'Nến quế',
  price: 250000,
  images: ['a.jpg'],
  categoryId: 'am',
  aromaLevel: 'medium',
  size: 'small',
  status: 'active',
  isNew: false,
  isFeatured: false,
  ...over,
});

it('thêm, chặn tên trùng (không dấu), sửa, ẩn, sắp xếp; chưa đăng nhập thì 401', async () => {
  await t.anon().get('/api/admin/concepts').expect(401);
  const noel = await t
    .post('/api/admin/concepts', {
      name: { vi: 'Giáng sinh', en: 'Christmas' },
      color: 'red',
    })
    .expect(201);
  expect(noel.body).toEqual({
    id: 'giang-sinh',
    name: { vi: 'Giáng sinh', en: 'Christmas' },
    color: 'red',
    hidden: false,
    startsOn: null,
    endsOn: null,
  });
  await t.post('/api/admin/concepts', { name: { vi: 'GIANG SINH', en: '' } }).expect(409);
  expect((await t.post('/api/admin/concepts', { name: { vi: 'Tết', en: '' } }).expect(201)).body.name.en).toBe('Tết');
  await t
    .patch('/api/admin/concepts/giang-sinh', {
      hidden: true,
      name: { vi: 'Noel', en: 'Christmas' },
    })
    .expect(200);
  await t.put('/api/admin/concepts/order', { ids: ['tet', 'giang-sinh'] }).expect(200);
  await t.put('/api/admin/concepts/order', { ids: ['tet'] }).expect(409);
  const list = (await t.get('/api/admin/concepts').expect(200)).body;
  expect(list.map((c: { id: string; name: { vi: string }; hidden: boolean }) => [c.id, c.name.vi, c.hidden])).toEqual([
    ['tet', 'Tết', false],
    ['giang-sinh', 'Noel', true],
  ]);
});

it('gắn vào sản phẩm: nhiều concept, không bắt buộc; concept không có thì 400; PUT không gửi thì rời mọi concept; xóa concept chỉ gỡ khỏi sản phẩm', async () => {
  await t.post('/api/admin/categories', { id: 'am', name: { vi: 'Ấm', en: '' } }).expect(201);
  await t.post('/api/admin/concepts', { name: { vi: 'Noel', en: '' } }).expect(201);
  await t.post('/api/admin/concepts', { name: { vi: 'Tết', en: '' } }).expect(201);

  expect((await t.post('/api/admin/products', product({ name: 'Không dịp' })).expect(201)).body.conceptIds).toEqual([]);
  const r = await t.post('/api/admin/products', product({ conceptIds: ['tet', 'noel', 'noel'] })).expect(201);
  expect(r.body.conceptIds).toEqual(['noel', 'tet']); // bỏ trùng, theo thứ tự ở trang Concept
  expect((await t.post('/api/admin/products', product({ name: 'Lỗi', conceptIds: ['khong-co'] })).expect(400)).body.message).toContain('concept');

  expect((await t.put('/api/admin/products/nen-que', product({ conceptIds: ['tet'] })).expect(200)).body.conceptIds).toEqual(['tet']);
  expect((await t.get('/api/admin/products/nen-que').expect(200)).body.conceptIds).toEqual(['tet']);
  expect((await t.put('/api/admin/products/nen-que', product()).expect(200)).body.conceptIds).toEqual([]);

  await t.put('/api/admin/products/nen-que', product({ conceptIds: ['noel', 'tet'] })).expect(200);
  await t.del('/api/admin/concepts/noel').expect(204);
  expect((await t.get('/api/admin/products/nen-que').expect(200)).body.conceptIds).toEqual(['tet']);
  await t.del('/api/admin/concepts/noel').expect(404);
});

it('web (GET /api/shop/products): concept ẩn không trả và bỏ khỏi conceptIds; chỉ concept đang có sản phẩm bán', async () => {
  await t.post('/api/admin/categories', { id: 'am', name: { vi: 'Ấm', en: '' } }).expect(201);
  for (const vi of ['Noel', 'Tết', 'Valentine']) await t.post('/api/admin/concepts', { name: { vi, en: '' } }).expect(201);
  await t.patch('/api/admin/concepts/tet', { hidden: true }).expect(200);
  await t.post('/api/admin/products', product({ conceptIds: ['noel', 'tet'] })).expect(201);
  await t.post('/api/admin/products', product({ name: 'Đang ẩn', status: 'hidden', conceptIds: ['valentine'] })).expect(201);

  const shop = (await t.anon().get('/api/shop/products').expect(200)).body;
  // Concept hiện chưa kết thúc đều trả (Valentine chỉ có mẫu đang tạm ẩn — web báo chưa có mẫu); Tết ẩn thì không
  expect(shop.concepts.map((c: { id: string }) => c.id)).toEqual(['noel', 'valentine']);
  expect(shop.products.map((p: { id: string; conceptIds: string[] }) => [p.id, p.conceptIds])).toEqual([['nen-que', ['noel']]]);
});

// Ngày theo giờ VN, lệch so với hôm nay (test không phụ thuộc ngày chạy)
const dayVN = (offset: number) => new Date(Date.now() + 7 * 3_600_000 + offset * 86_400_000).toISOString().slice(0, 10);

it('thời gian: lưu / bỏ ngày, chặn kết thúc trước bắt đầu và ngày không có thật', async () => {
  const r = await t
    .post('/api/admin/concepts', {
      name: { vi: 'Noel', en: '' },
      startsOn: '2026-12-01',
      endsOn: '2026-12-26',
    })
    .expect(201);
  expect(r.body).toMatchObject({
    id: 'noel',
    startsOn: '2026-12-01',
    endsOn: '2026-12-26',
  });
  expect((await t.post('/api/admin/concepts', { name: { vi: 'Tết', en: '' } }).expect(201)).body).toMatchObject({ startsOn: null, endsOn: null });
  expect((await t.patch('/api/admin/concepts/noel', { endsOn: '2026-11-30' }).expect(400)).body.message).toContain('Ngày kết thúc');
  await t.patch('/api/admin/concepts/noel', { startsOn: '2026-02-30' }).expect(400);
  await t.patch('/api/admin/concepts/noel', { startsOn: '01/12/2026' }).expect(400);
  // Không gửi thì giữ; null thì bỏ
  expect((await t.patch('/api/admin/concepts/noel', { hidden: true }).expect(200)).body).toMatchObject({ startsOn: '2026-12-01', endsOn: '2026-12-26' });
  expect((await t.patch('/api/admin/concepts/noel', { startsOn: null }).expect(200)).body).toMatchObject({ startsOn: null, endsOn: '2026-12-26' });
});

it('web: ngoài mùa thì ẩn sản phẩm; bán khi bất kỳ concept hiện nào trong mùa; concept ẩn bỏ qua; không đổi trạng thái sản phẩm', async () => {
  await t.post('/api/admin/categories', { id: 'am', name: { vi: 'Ấm', en: '' } }).expect(201);
  await t
    .post('/api/admin/concepts', {
      id: 'dang',
      name: { vi: 'Đang mùa', en: '' },
      startsOn: dayVN(-1),
      endsOn: dayVN(0),
    })
    .expect(201);
  await t
    .post('/api/admin/concepts', {
      id: 'sap',
      name: { vi: 'Sắp tới', en: '' },
      startsOn: dayVN(1),
    })
    .expect(201);
  await t
    .post('/api/admin/concepts', {
      id: 'het',
      name: { vi: 'Hết mùa', en: '' },
      endsOn: dayVN(-1),
    })
    .expect(201);
  await t
    .post('/api/admin/concepts', {
      id: 'an',
      name: { vi: 'Ẩn', en: '' },
      endsOn: dayVN(-1),
      hidden: true,
    })
    .expect(201);
  const make = (name: string, conceptIds: string[]) => t.post('/api/admin/products', product({ name, conceptIds })).expect(201);
  await make('Trong mua', ['dang']);
  await make('Hai dip', ['het', 'dang']);
  await make('Sap mo', ['sap']);
  await make('Da het', ['het']);
  await make('Chi concept an', ['an']);
  await make('Khong dip', []);

  const shop = (await t.anon().get('/api/shop/products').expect(200)).body;
  const ids = Object.fromEntries(shop.products.map((p: { id: string; conceptIds: string[] }) => [p.id, p.conceptIds]));
  expect(ids).toEqual({
    'trong-mua': ['dang'],
    'hai-dip': ['dang'],
    'chi-concept-an': [],
    'khong-dip': [],
  });
  // Hàng lọc: concept đang mùa + sắp tới (web đếm ngược); đã kết thúc và concept ẩn thì không
  expect(shop.concepts).toEqual([
    { id: 'dang', name: 'Đang mùa', nameEn: 'Đang mùa', startsOn: dayVN(-1), endsOn: dayVN(0) },
    { id: 'sap', name: 'Sắp tới', nameEn: 'Sắp tới', startsOn: dayVN(1), endsOn: null },
  ]);
  // BO vẫn thấy đủ, trạng thái giữ nguyên Đang bán
  const admin = (await t.get('/api/admin/products').expect(200)).body;
  expect(admin.filter((p: { status: string }) => p.status === 'active')).toHaveLength(6);
});
