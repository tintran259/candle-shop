// Báo Sentry các lỗi phía máy chủ (5xx, lỗi chưa xử lý) rồi trả lỗi như mặc định của Nest.
// Lỗi 4xx (dữ liệu sai, trùng, chưa đăng nhập…) là từ chối hợp lệ — không báo. Chưa cấu hình SENTRY_DSN thì captureException không làm gì
import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    if (status >= 500) Sentry.captureException(exception);
    super.catch(exception, host);
  }
}
