// Chống ghi trùng khi BO gửi lại yêu cầu (mất mạng giữa chừng: BE đã làm nhưng BO không nhận được trả lời).
// BO gắn header Idempotency-Key cho mỗi yêu cầu ghi; cùng khóa + cùng method + đường dẫn trong 1 giờ thì trả lại kết quả lần đầu, không chạy lại.
// Lỗi không giữ (giao dịch đã hủy, gửi lại được). Giữ trong bộ nhớ: đủ cho một máy chủ, BE khởi động lại thì quên — chấp nhận được
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { from, lastValueFrom, type Observable } from 'rxjs';

const TTL_MS = 60 * 60 * 1000;
const MAX = 2000;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly done = new Map<string, { at: number; result: Promise<unknown> }>();

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers['idempotency-key'];
    if (req.method === 'GET' || typeof header !== 'string' || !header || header.length > 100) return next.handle();
    this.prune();
    const key = `${req.method} ${req.originalUrl} ${header}`;
    const hit = this.done.get(key);
    if (hit) return from(hit.result);
    const result = lastValueFrom(next.handle(), { defaultValue: undefined });
    this.done.set(key, { at: Date.now(), result });
    result.catch(() => this.done.delete(key));
    return from(result);
  }

  private prune() {
    const old = Date.now() - TTL_MS;
    for (const [k, v] of this.done) if (v.at < old || this.done.size > MAX) this.done.delete(k);
  }
}
