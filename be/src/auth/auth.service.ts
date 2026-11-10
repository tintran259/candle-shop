// Đăng nhập BO bằng PIN 6 số (shop chỉ có 1 người dùng, không phân quyền — docs/backend.md#đăng-nhập).
// PIN lấy từ biến môi trường ADMIN_PIN_HASH (pnpm auth:pin <6 số>), token ký bằng JWT_SECRET.
// Chặn đoán thử: sai 5 lần thì khóa chung toàn hệ thống (không theo IP), khóa lâu dần; lưu DB nên khởi động lại không xóa.
import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { verifyPassword } from './password.js';
import { lockDuration, MAX_TRIES } from './pin.js';
import { signToken, verifyToken, type TokenPayload } from './token.js';

const DAY = 24 * 60 * 60 * 1000;
// Ghi nhớ thiết bị: 30 ngày. Không ghi nhớ: 12 giờ
export const REMEMBER_MS = 30 * DAY;
export const SESSION_MS = 12 * 60 * 60 * 1000;
const ADMIN = { sub: 'admin', name: 'Admin 2510' };
const GUARD_ID = 'admin';
// Mốc thu hồi đọc lại từ DB sau mỗi khoảng này (giữ trong bộ nhớ để không truy vấn DB mỗi request)
const REVOKE_CACHE_MS = 30_000;

const locked = (until: Date, now: number) =>
  new HttpException({ message: 'Nhập sai PIN nhiều lần, tạm khóa đăng nhập.', retryIn: Math.ceil((until.getTime() - now) / 1000) }, HttpStatus.TOO_MANY_REQUESTS);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private revoked = { value: 0, readAt: 0 };

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    if (this.secret().length < 32) this.logger.warn('JWT_SECRET ngắn hơn 32 ký tự — đặt chuỗi ngẫu nhiên dài trước khi đưa lên mạng.');
    if (!this.config.get<string>('ADMIN_PIN_HASH')) this.logger.warn('Chưa có ADMIN_PIN_HASH — chưa đăng nhập được (tạo bằng pnpm auth:pin <6 số>).');
  }

  private secret() {
    return this.config.get<string>('JWT_SECRET') ?? '';
  }

  async login(pin: string, remember: boolean) {
    const hash = this.config.get<string>('ADMIN_PIN_HASH');
    if (!hash || !this.secret()) throw new ServiceUnavailableException('Máy chủ chưa cấu hình PIN đăng nhập.');
    const now = Date.now();
    const guard = await this.prisma.loginGuard.upsert({ where: { id: GUARD_ID }, create: { id: GUARD_ID }, update: {} });
    if (guard.lockedUntil && guard.lockedUntil.getTime() > now) throw locked(guard.lockedUntil, now);

    if (!(await verifyPassword(pin, hash))) {
      const failed = guard.failed + 1;
      if (failed >= MAX_TRIES) {
        const until = new Date(now + lockDuration(guard.level));
        await this.prisma.loginGuard.update({ where: { id: GUARD_ID }, data: { failed: 0, level: guard.level + 1, lockedUntil: until } });
        throw locked(until, now);
      }
      await this.prisma.loginGuard.update({ where: { id: GUARD_ID }, data: { failed } });
      throw new UnauthorizedException({ message: 'PIN không đúng.', remaining: MAX_TRIES - failed });
    }

    await this.prisma.loginGuard.update({ where: { id: GUARD_ID }, data: { failed: 0, level: 0, lockedUntil: null } });
    const session: TokenPayload = { ...ADMIN, iat: now, exp: now + (remember ? REMEMBER_MS : SESSION_MS) };
    return { token: signToken(session, this.secret()), name: session.name, expiresAt: session.exp };
  }

  // Token hợp lệ thì trả phiên, không thì null
  verify(token: string) {
    const secret = this.secret();
    return secret ? verifyToken(token, secret) : null;
  }

  // Token cấp trước lần "Đăng xuất mọi thiết bị" gần nhất
  async isRevoked(session: TokenPayload) {
    const now = Date.now();
    if (now - this.revoked.readAt > REVOKE_CACHE_MS) {
      const guard = await this.prisma.loginGuard.findUnique({ where: { id: GUARD_ID }, select: { revokedBefore: true } });
      this.revoked = { value: guard?.revokedBefore?.getTime() ?? 0, readAt: now };
    }
    return (session.iat ?? 0) < this.revoked.value;
  }

  // Đăng xuất mọi thiết bị (kể cả máy đang dùng): mọi token đã cấp hết hiệu lực
  async logoutAll() {
    const at = new Date();
    await this.prisma.loginGuard.upsert({ where: { id: GUARD_ID }, create: { id: GUARD_ID, revokedBefore: at }, update: { revokedBefore: at } });
    this.revoked = { value: at.getTime(), readAt: Date.now() };
    return { ok: true };
  }
}
