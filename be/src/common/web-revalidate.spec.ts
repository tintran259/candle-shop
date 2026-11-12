// Đăng / gỡ giao diện → báo web làm mới tag site-theme (gộp các lần sát nhau); chưa đặt FRONTEND_URL / đang chạy test / web lỗi thì bỏ qua
import { WebRevalidate } from './web-revalidate.js';

describe('WebRevalidate', () => {
  const env = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://web.test/,http://khac.test';
    process.env.REVALIDATE_SECRET = 'bi-mat-thu';
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    process.env = { ...env };
  });

  it('gộp nhiều lần sát nhau thành một lượt, gọi mọi địa chỉ web trong FRONTEND_URL (bỏ "/" cuối), đúng tag + mã bí mật', async () => {
    const w = new WebRevalidate();
    w.siteTheme();
    w.siteTheme();
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(600);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['http://web.test/api/revalidate?tag=site-theme', 'http://khac.test/api/revalidate?tag=site-theme']);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: { 'x-revalidate-secret': 'bi-mat-thu' } });
  });

  it('không gọi: chưa đặt FRONTEND_URL, đang chạy test', async () => {
    const w = new WebRevalidate();
    delete process.env.FRONTEND_URL;
    w.siteTheme();
    process.env.FRONTEND_URL = 'http://web.test';
    process.env.NODE_ENV = 'test';
    w.siteTheme();
    await vi.advanceTimersByTimeAsync(600);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('web lỗi / chưa chạy: bỏ qua, không ném lỗi', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const w = new WebRevalidate();
    w.siteTheme();
    await vi.advanceTimersByTimeAsync(600);
    // Cả hai địa chỉ đều được thử, lỗi không ném ra ngoài
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
