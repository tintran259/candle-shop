// Giao diện web: danh sách (Mặc định + giao diện theo concept), nháp / đăng / gỡ riêng từng cái, kiểm tra giới hạn;
// web (GET /api/shop/home) chọn giao diện của concept đang trong mùa + 3 mẫu Xưởng nến
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

const dayVN = (offset: number) => new Date(Date.now() + 7 * 3_600_000 + offset * 86_400_000).toISOString().slice(0, 10);
const base = { announcement: 'Đổ tay theo đơn', hero: { image: 'https://res.cloudinary.com/demo/image/upload/hero.jpg', title: 'Một chút ánh sáng.\nThật nhiều cảm xúc.', mark: 'Made by hand' } };
const URL = '/api/admin/site-themes';
const byId = (list: { id: string }[], id: string) => list.find((x) => x.id === id) as Record<string, unknown>;

it('danh sách: Mặc định luôn có; thêm / đổi tên / xóa; nháp → đăng → gỡ; concept chỉ thuộc một giao diện; chặn dữ liệu sai; chưa đăng nhập 401', async () => {
  await t.anon().get(URL).expect(401);
  expect((await t.get(URL).expect(200)).body).toEqual([{ id: 'default', name: 'Mặc định', isDefault: true, published: null, draft: null, publishedAt: null, updatedAt: expect.any(String) }]);

  await t.post('/api/admin/concepts', { id: 'noel', name: { vi: 'Noel', en: '' } }).expect(201);
  await t.post(URL, { id: 'giang-sinh', name: 'Giáng sinh 2026' }).expect(201);
  await t.post(URL, { id: 'giang-sinh', name: 'Trùng' }).expect(400);
  await t.post(URL, { name: '' }).expect(400);

  // Nháp: bỏ concept không còn; Mặc định không nhận conceptIds, giao diện khác không nhận announcementOn
  let list = (await t.put(`${URL}/giang-sinh/draft`, { conceptIds: ['noel', 'khong-co', 'noel'], announcementOn: false, announcement: 'Noel' }).expect(200)).body;
  expect(byId(list, 'giang-sinh')).toMatchObject({ draft: { conceptIds: ['noel'], announcement: 'Noel' }, published: null });
  expect(byId(list, 'giang-sinh').draft).not.toHaveProperty('announcementOn');
  list = (await t.put(`${URL}/default/draft`, { ...base, conceptIds: ['noel'], announcementOn: false }).expect(200)).body;
  expect(byId(list, 'default').draft).toEqual({ ...base, announcementOn: false });

  // Concept đã thuộc giao diện khác
  await t.post(URL, { id: 'khac', name: 'Khác' }).expect(201);
  expect((await t.put(`${URL}/khac/draft`, { conceptIds: ['noel'] }).expect(400)).body.message).toBe('Concept "Noel" đã thuộc giao diện "Giáng sinh 2026".');

  expect((await t.put(`${URL}/default/draft`, { hero: { title: 'a\nb\nc' } }).expect(400)).body.message).toContain('tối đa 2 dòng');
  await t.put(`${URL}/default/draft`, { hero: { mark: 'x'.repeat(33) } }).expect(400);
  await t.put(`${URL}/default/draft`, { hero: { image: 'javascript:alert(1)' } }).expect(400);
  await t.put(`${URL}/default/draft`, { hero: { focus: 'top' } }).expect(400);
  await t.put(`${URL}/khong-co/draft`, {}).expect(404);

  list = (await t.post(`${URL}/default/publish`, base).expect(200)).body;
  expect(byId(list, 'default')).toMatchObject({ published: base, draft: null, publishedAt: expect.any(String) });
  // Đăng Mặc định không đụng giao diện khác
  expect(byId(list, 'giang-sinh')).toMatchObject({ draft: { conceptIds: ['noel'] }, published: null });

  await t.put(`${URL}/default/draft`, { announcement: 'Đang sửa' }).expect(200);
  expect(byId((await t.del(`${URL}/default/draft`).expect(200)).body, 'default')).toMatchObject({ draft: null, published: base });

  // Gỡ khỏi web: bản đã đăng thành nháp
  await t.post(`${URL}/giang-sinh/publish`, { conceptIds: ['noel'], announcement: 'Noel' }).expect(200);
  list = (await t.post(`${URL}/giang-sinh/unpublish`).expect(200)).body;
  expect(byId(list, 'giang-sinh')).toMatchObject({ published: null, publishedAt: null, draft: { conceptIds: ['noel'], announcement: 'Noel' } });
  await t.post(`${URL}/default/unpublish`).expect(400);

  list = (await t.patch(`${URL}/giang-sinh`, { name: 'Noel ấm áp' }).expect(200)).body;
  expect(byId(list, 'giang-sinh').name).toBe('Noel ấm áp');
  await t.del(`${URL}/default`).expect(400);
  list = (await t.del(`${URL}/giang-sinh`).expect(200)).body;
  expect(list.map((x: { id: string }) => x.id)).toEqual(['default', 'khac']);
  // Xóa xong thì concept rảnh cho giao diện khác
  await t.put(`${URL}/khac/draft`, { conceptIds: ['noel'] }).expect(200);
});

it('web: chưa cấu hình thì theme rỗng; giao diện đã đăng của concept đang trong mùa đè lên Mặc định, hết mùa / chưa đăng thì về Mặc định; Xưởng nến: nổi bật trước, tối đa 3', async () => {
  const empty = (await t.anon().get('/api/shop/home').expect(200)).body;
  expect(empty).toMatchObject({ theme: { themeId: null, conceptId: null, announcementOn: true, hero: {} }, featured: [] });

  await t.post('/api/admin/categories', { id: 'am', name: { vi: 'Ấm', en: '' } }).expect(201);
  await t.post('/api/admin/concepts', { id: 'noel', name: { vi: 'Noel', en: '' }, startsOn: dayVN(-1), endsOn: dayVN(1) }).expect(201);
  await t.post('/api/admin/concepts', { id: 'tet', name: { vi: 'Tết', en: '' }, startsOn: dayVN(5) }).expect(201);
  const product = (name: string, isFeatured = false) => ({ name, price: 250000, images: ['a.jpg'], categoryId: 'am', aromaLevel: 'medium', size: 'small', status: 'active', isNew: false, isFeatured });
  for (const [name, f] of [
    ['Mot', false],
    ['Hai', true],
    ['Ba', false],
    ['Bon', true],
    ['Nam', false],
  ] as const)
    await t.post('/api/admin/products', product(name, f)).expect(201);

  await t.post(`${URL}/default/publish`, base).expect(200);
  await t.post(URL, { id: 'le-tet', name: 'Tết' }).expect(201);
  await t.post(`${URL}/le-tet/publish`, { conceptIds: ['tet'], announcement: 'Tết' }).expect(200);
  await t.post(URL, { id: 'giang-sinh', name: 'Giáng sinh' }).expect(201);
  // Mới lưu nháp: web chưa dùng
  await t.put(`${URL}/giang-sinh/draft`, { conceptIds: ['noel'], announcement: 'Noel nháp' }).expect(200);
  expect((await t.anon().get('/api/shop/home').expect(200)).body.theme).toMatchObject({ themeId: null, announcement: 'Đổ tay theo đơn' });

  await t.post(`${URL}/giang-sinh/publish`, { conceptIds: ['noel'], announcement: 'Noel đã mở bán', hero: { image: 'https://res.cloudinary.com/demo/image/upload/noel.jpg', title: '' } }).expect(200);
  const home = (await t.anon().get('/api/shop/home').expect(200)).body;
  expect(home.theme).toMatchObject({
    themeId: 'giang-sinh',
    conceptId: 'noel',
    announcement: 'Noel đã mở bán',
    hero: { image: 'https://res.cloudinary.com/demo/image/upload/noel.jpg', title: base.hero.title, mark: 'Made by hand' },
  });
  const featured = home.featured.map((p: { name: string }) => p.name);
  expect(featured).toHaveLength(3);
  expect(featured.slice(0, 2).sort()).toEqual(['Bon', 'Hai']);
  expect(home.categories).toEqual([{ id: 'am', name: 'Ấm', nameEn: 'Ấm' }]);

  // Hết mùa Noel → về Mặc định
  await t.patch('/api/admin/concepts/noel', { startsOn: dayVN(-10), endsOn: dayVN(-2) }).expect(200);
  expect((await t.anon().get('/api/shop/home').expect(200)).body.theme).toMatchObject({ themeId: null, conceptId: null, announcement: 'Đổ tay theo đơn', hero: { image: base.hero.image } });
});

// Đăng một lần rồi để thời gian trôi (giả đồng hồ, chỉ Date): đúng 00:00 giờ VN ngày bắt đầu web tự đổi, qua ngày kết thúc tự về Mặc định — không cần thao tác gì ở BO
it('web: tới ngày concept thì tự đổi giao diện, hết mùa tự về Mặc định (theo giờ VN); nhiều concept: giữa hai mùa dùng Mặc định', async () => {
  const noel = { start: dayVN(2), end: dayVN(3) };
  const tet = dayVN(6);
  await t.post('/api/admin/concepts', { id: 'noel', name: { vi: 'Noel', en: '' }, startsOn: noel.start, endsOn: noel.end }).expect(201);
  await t.post('/api/admin/concepts', { id: 'tet', name: { vi: 'Tết', en: '' }, startsOn: tet, endsOn: tet }).expect(201);
  await t.post(`${URL}/default/publish`, base).expect(200);
  await t.post(URL, { id: 'mua-le', name: 'Mùa lễ' }).expect(201);
  await t.post(`${URL}/mua-le/publish`, { conceptIds: ['noel', 'tet'], announcement: 'Mùa lễ', hero: { mark: 'Ấm áp mùa lễ' } }).expect(200);

  // 00:00 giờ VN của một ngày
  const midnightVN = (day: string) => Date.parse(`${day}T00:00:00+07:00`);
  const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  const at = async (ms: number) => {
    vi.setSystemTime(ms);
    const theme = (await t.anon().get('/api/shop/home').expect(200)).body.theme;
    return { themeId: theme.themeId, conceptId: theme.conceptId, announcement: theme.announcement, mark: theme.hero.mark };
  };
  const live = (conceptId: string) => ({ themeId: 'mua-le', conceptId, announcement: 'Mùa lễ', mark: 'Ấm áp mùa lễ' });
  const fallback = { themeId: null, conceptId: null, announcement: 'Đổ tay theo đơn', mark: 'Made by hand' };

  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    expect(await at(Date.now())).toEqual(fallback);
    expect(await at(midnightVN(noel.start) - 1000)).toEqual(fallback);
    expect(await at(midnightVN(noel.start))).toEqual(live('noel'));
    expect(await at(midnightVN(nextDay(noel.end)) - 1000)).toEqual(live('noel'));
    expect(await at(midnightVN(nextDay(noel.end)))).toEqual(fallback);
    expect(await at(midnightVN(tet) + 12 * 3_600_000)).toEqual(live('tet'));
    expect(await at(midnightVN(nextDay(tet)))).toEqual(fallback);
  } finally {
    vi.useRealTimers();
  }
});
