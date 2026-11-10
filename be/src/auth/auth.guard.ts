// Chặn mọi API khi chưa đăng nhập (Authorization: Bearer <token>). Route gắn @Public() thì bỏ qua.
import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import type { TokenPayload } from './token.js';

const PUBLIC = 'isPublic';
export const Public = () => SetMetadata(PUBLIC, true);

export type AuthedRequest = Request & { session?: TokenPayload };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    const session = scheme === 'Bearer' && token ? this.auth.verify(token) : null;
    if (!session || (await this.auth.isRevoked(session))) throw new UnauthorizedException('Phiên đăng nhập hết hạn, đăng nhập lại.');
    req.session = session;
    return true;
  }
}
