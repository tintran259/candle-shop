// Chỉ lỗi phía máy chủ (5xx, lỗi chưa xử lý) mới báo Sentry; lỗi 4xx thì không
import {
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './sentry.filter.js';

vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

describe('SentryFilter', () => {
  const filter = new SentryFilter();
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
    vi.spyOn(BaseExceptionFilter.prototype, 'catch').mockImplementation(
      () => undefined,
    );
  });

  it('lỗi chưa xử lý và 5xx: báo Sentry, vẫn trả lỗi như mặc định', () => {
    const boom = new Error('boom');
    filter.catch(boom, {} as never);
    filter.catch(new ServiceUnavailableException('DB tắt'), {} as never);
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
    expect(Sentry.captureException).toHaveBeenCalledWith(boom);
    expect(BaseExceptionFilter.prototype.catch).toHaveBeenCalledTimes(2);
  });

  it('4xx: không báo', () => {
    filter.catch(new BadRequestException('sai'), {} as never);
    filter.catch(new HttpException('chưa đăng nhập', 401), {} as never);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
