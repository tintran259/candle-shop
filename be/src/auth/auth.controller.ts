import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Matches } from 'class-validator';
import { Public, type AuthedRequest } from './auth.guard.js';
import { AuthService } from './auth.service.js';

class LoginDto {
  @Matches(/^\d{6}$/, { message: 'PIN gồm 6 chữ số.' })
  pin: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Đăng nhập bằng PIN: trả token (Bearer) và hạn dùng
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.auth.login(body.pin, !!body.remember);
  }

  // Đăng xuất mọi thiết bị (kể cả máy này) — lỡ mất máy / lộ phiên
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(200)
  logoutAll() {
    return this.auth.logoutAll();
  }

  // Phiên hiện tại
  @ApiBearerAuth()
  @Get('me')
  me(@Req() req: AuthedRequest) {
    const s = req.session!;
    return { name: s.name, expiresAt: s.exp };
  }
}
