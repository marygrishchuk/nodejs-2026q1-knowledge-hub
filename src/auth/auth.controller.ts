import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AUTH_RATE_LIMIT } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Req() request: Request, @Body() dto: SignupDto) {
    this.authService.assertRateLimit(
      request.ip,
      AUTH_RATE_LIMIT.endpointSignup,
    );
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() request: Request, @Body() dto: LoginDto) {
    this.authService.assertRateLimit(request.ip, AUTH_RATE_LIMIT.endpointLogin);
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogoutDto) {
    this.authService.logout(dto.refreshToken);
    return { status: 'ok' };
  }
}
