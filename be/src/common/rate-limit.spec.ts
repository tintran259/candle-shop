// Giới hạn request mỗi IP trong 1 phút: vượt thì 429 kèm Retry-After; sang phút mới hoặc IP khác thì gọi được
import { rateLimit } from './rate-limit.js';

const call = (mw: ReturnType<typeof rateLimit>, ip: string) => {
  const res = { code: 200, headers: {} as Record<string, string>, body: undefined as unknown };
  let passed = false;
  mw({ ip } as never, { setHeader: (k: string, v: string) => (res.headers[k] = v), status: (c: number) => ((res.code = c), { json: (b: unknown) => (res.body = b) }) } as never, () => (passed = true));
  return { passed, ...res };
};

describe('rateLimit', () => {
  afterEach(() => vi.useRealTimers());

  it('cho qua tới mức giới hạn, vượt thì 429; IP khác không ảnh hưởng', () => {
    const mw = rateLimit(3);
    expect([1, 2, 3].map(() => call(mw, '1.1.1.1').passed)).toEqual([true, true, true]);
    const blocked = call(mw, '1.1.1.1');
    expect(blocked.passed).toBe(false);
    expect(blocked.code).toBe(429);
    expect(Number(blocked.headers['Retry-After'])).toBeGreaterThan(0);
    expect(call(mw, '2.2.2.2').passed).toBe(true);
  });

  it('sang phút mới thì đếm lại', () => {
    vi.useFakeTimers();
    const mw = rateLimit(1);
    expect(call(mw, '1.1.1.1').passed).toBe(true);
    expect(call(mw, '1.1.1.1').passed).toBe(false);
    vi.advanceTimersByTime(60_000);
    expect(call(mw, '1.1.1.1').passed).toBe(true);
  });
});
