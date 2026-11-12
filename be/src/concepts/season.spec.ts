// Mùa của concept: ngày giờ Việt Nam, khoảng tính cả hai đầu, trống = mọi ngày; concept ẩn bỏ qua
import { inSeason, sellableNow, todayVN } from './season.js';

const d = (s: string | null) => (s ? new Date(`${s}T00:00:00.000Z`) : null);
const c = (startsOn: string | null, endsOn: string | null, hidden = false) => ({
  hidden,
  startsOn: d(startsOn),
  endsOn: d(endsOn),
});

describe('todayVN', () => {
  it('đổi sang giờ Việt Nam: 17:30 UTC ngày 25 là ngày 26 ở VN', () => {
    expect(todayVN(Date.parse('2026-12-25T17:30:00Z'))).toBe('2026-12-26');
    expect(todayVN(Date.parse('2026-12-25T16:59:00Z'))).toBe('2026-12-25');
  });
});

describe('inSeason', () => {
  it('tính cả ngày bắt đầu và ngày kết thúc; trống một đầu hoặc cả hai', () => {
    expect(inSeason(c('2026-12-01', '2026-12-26'), '2026-12-01')).toBe(true);
    expect(inSeason(c('2026-12-01', '2026-12-26'), '2026-12-26')).toBe(true);
    expect(inSeason(c('2026-12-01', '2026-12-26'), '2026-11-30')).toBe(false);
    expect(inSeason(c('2026-12-01', '2026-12-26'), '2026-12-27')).toBe(false);
    expect(inSeason(c(null, '2026-12-26'), '2020-01-01')).toBe(true);
    expect(inSeason(c('2026-12-01', null), '2030-01-01')).toBe(true);
    expect(inSeason(c(null, null), '2026-06-01')).toBe(true);
  });
});

describe('sellableNow', () => {
  const today = '2026-12-10';
  it('không có concept (hoặc chỉ concept ẩn) thì luôn bán', () => {
    expect(sellableNow([], today)).toBe(true);
    expect(sellableNow([c('2027-01-20', '2027-02-20', true)], today)).toBe(true);
  });
  it('bán khi BẤT KỲ concept hiện nào đang trong mùa; hết mùa tất cả thì đóng', () => {
    expect(sellableNow([c('2026-12-01', '2026-12-26'), c('2027-01-20', '2027-02-20')], today)).toBe(true);
    expect(sellableNow([c('2026-11-01', '2026-11-30'), c('2027-01-20', '2027-02-20')], today)).toBe(false);
    // concept ẩn đang trong mùa không mở bán thay
    expect(sellableNow([c('2026-12-01', '2026-12-26', true), c('2027-01-20', '2027-02-20')], today)).toBe(false);
  });
});
