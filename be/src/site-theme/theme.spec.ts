// Chọn giao diện web theo mùa: concept hiện đầu tiên đang trong mùa có giao diện đã đăng gắn với nó thì đè lên Mặc định, từng trường một
import { resolveTheme, type ThemeRow } from './theme.js';

const d = (s: string | null) => (s ? new Date(`${s}T00:00:00.000Z`) : null);
const concept = (id: string, startsOn: string | null, endsOn: string | null, hidden = false) => ({ id, hidden, startsOn: d(startsOn), endsOn: d(endsOn) });
const today = '2026-12-10';

const themes: ThemeRow[] = [
  {
    id: 'default',
    published: {
      announcement: 'Đổ tay theo đơn',
      logo: { light: 'https://x/logo-sang.png', dark: 'https://x/logo-toi.png' },
      hero: { image: 'https://x/hero.jpg', focus: 'right', eyebrow: 'Nến thủ công', title: 'Một chút ánh sáng.\nThật nhiều cảm xúc.', mark: 'Made by hand' },
    },
  },
  { id: 'le-tet', published: { conceptIds: ['tet'], announcement: 'Tết đã mở bán' } },
  { id: 'giang-sinh', published: { conceptIds: ['noel', 'qua'], announcement: 'Noel đã mở bán', hero: { image: 'https://x/noel.jpg', eyebrow: '', title: 'Giáng sinh ấm áp' } } },
  // Chưa đăng: web không dùng
  { id: 'valentine', published: null },
];

describe('resolveTheme', () => {
  it('chưa có giao diện nào: rỗng, thanh thông báo bật', () => {
    expect(resolveTheme([], [], today)).toEqual({
      themeId: null,
      conceptId: null,
      announcementOn: true,
      announcement: undefined,
      logo: { light: undefined, dark: undefined },
      hero: {},
      collection: {},
    });
  });

  it('không concept nào trong mùa: dùng Mặc định', () => {
    const r = resolveTheme(themes, [concept('noel', '2026-12-15', '2026-12-26')], today);
    expect(r).toMatchObject({ themeId: null, conceptId: null, announcement: 'Đổ tay theo đơn', hero: { image: 'https://x/hero.jpg' } });
  });

  it('concept trong mùa: đè từng trường, trường trống lấy Mặc định; một giao diện dùng cho nhiều concept', () => {
    const r = resolveTheme(themes, [concept('qua', '2026-12-01', '2026-12-26')], today);
    expect(r).toMatchObject({ themeId: 'giang-sinh', conceptId: 'qua', announcement: 'Noel đã mở bán' });
    expect(r.hero).toEqual({ image: 'https://x/noel.jpg', focus: 'right', eyebrow: 'Nến thủ công', title: 'Giáng sinh ấm áp', mark: 'Made by hand' });
    expect(r.logo).toEqual({ light: 'https://x/logo-sang.png', dark: 'https://x/logo-toi.png' });
  });

  it('nhiều concept trong mùa: theo thứ tự trang Concept; concept ẩn, không có giao diện hoặc giao diện chưa đăng thì bỏ qua', () => {
    const order = [concept('valentine', null, null), concept('tet', null, null, true), concept('noel', null, null), concept('tet2', null, null)];
    expect(resolveTheme(themes, order, today).themeId).toBe('giang-sinh');
    expect(resolveTheme(themes, [concept('tet', null, null), concept('noel', null, null)], today).announcement).toBe('Tết đã mở bán');
  });

  // Lịch thật: giao diện "Mùa lễ" gắn Noel (13/11 – 29/11) + Tết (20/01 – 10/02), đăng một lần — tới ngày tự đổi, hết ngày tự về Mặc định
  it('tới ngày tự đổi theo concept, hết mùa tự về Mặc định; nhiều concept: khoảng trống giữa hai mùa dùng Mặc định', () => {
    const rows: ThemeRow[] = [themes[0], { id: 'mua-le', published: { conceptIds: ['noel', 'tet'], announcement: 'Mùa lễ' } }];
    const cs = [concept('noel', '2026-11-13', '2026-11-29'), concept('tet', '2027-01-20', '2027-02-10')];
    const on = (day: string) => resolveTheme(rows, cs, day);
    const timeline: [string, string | null, string | null][] = [
      ['2026-11-12', null, null],
      ['2026-11-13', 'mua-le', 'noel'],
      ['2026-11-29', 'mua-le', 'noel'],
      ['2026-11-30', null, null],
      ['2027-01-19', null, null],
      ['2027-01-20', 'mua-le', 'tet'],
      ['2027-02-10', 'mua-le', 'tet'],
      ['2027-02-11', null, null],
    ];
    for (const [day, themeId, conceptId] of timeline) {
      expect({ day, ...on(day) }).toMatchObject({ day, themeId, conceptId, announcement: themeId ? 'Mùa lễ' : 'Đổ tay theo đơn' });
    }
  });

  it('hai giao diện chồng mùa: concept xếp trên thắng; concept trên hết mùa thì tự sang giao diện của concept dưới', () => {
    const rows: ThemeRow[] = [themes[0], themes[1], themes[2]];
    const cs = [concept('tet', '2026-12-20', '2026-12-31'), concept('noel', '2026-12-01', '2026-12-26')];
    expect(resolveTheme(rows, cs, '2026-12-19').themeId).toBe('giang-sinh');
    expect(resolveTheme(rows, cs, '2026-12-20').themeId).toBe('le-tet');
    expect(resolveTheme(rows, cs, '2026-12-27').themeId).toBe('le-tet');
    expect(resolveTheme(rows, cs, '2027-01-01').themeId).toBeNull();
  });

  it('Xưởng nến: chữ ghép từng trường; mẫu chọn của giao diện thay cả danh sách, không chọn thì lấy của Mặc định', () => {
    const base: ThemeRow = { id: 'default', published: { collection: { title: 'Xưởng nến', heading: 'Ngày đẹp', productIds: ['a', 'b', 'c'] } } };
    const noel: ThemeRow = { id: 'noel-theme', published: { conceptIds: ['noel'], collection: { heading: 'Mùa Noel', note: '', productIds: ['n1', 'n2'] } } };
    const tet: ThemeRow = { id: 'tet-theme', published: { conceptIds: ['tet'], collection: { eyebrow: 'Tết', productIds: [] } } };
    const cs = [concept('noel', null, null), concept('tet', null, null)];
    expect(resolveTheme([base, noel], cs, today).collection).toEqual({ title: 'Xưởng nến', heading: 'Mùa Noel', productIds: ['n1', 'n2'] });
    expect(resolveTheme([base, tet], cs, today).collection).toEqual({ title: 'Xưởng nến', heading: 'Ngày đẹp', eyebrow: 'Tết', productIds: ['a', 'b', 'c'] });
    expect(resolveTheme([base], [], today).collection).toEqual({ title: 'Xưởng nến', heading: 'Ngày đẹp', productIds: ['a', 'b', 'c'] });
  });
});
