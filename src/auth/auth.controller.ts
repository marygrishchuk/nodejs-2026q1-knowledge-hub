import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthTokensResponseDto,
  LogoutOkResponseDto,
  SignupResponseDto,
} from '../common/swagger/entity-response.swagger.dto';
import { HttpErrorResponseDto } from '../common/swagger/http-error.swagger.dto';
import {
  ApiBadRequestValidation,
  ApiTooManyRequests,
} from '../common/swagger/swagger-common.decorators';
import { AuthService } from './auth.service';
import { AUTH_RATE_LIMIT } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@ApiExtraModels(
  SignupResponseDto,
  AuthTokensResponseDto,
  LogoutOkResponseDto,
  HttpErrorResponseDto,
)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register viewer user' })
  @ApiCreatedResponse({ type: SignupResponseDto })
  @ApiBadRequestValidation()
  @ApiTooManyRequests()
  async signup(@Req() request: Request, @Body() dto: SignupDto) {
    this.authService.assertRateLimit(
      request.ip,
      AUTH_RATE_LIMIT.endpointSignup,
    );
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login — returns access + refresh JWT' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiBadRequestValidation()
  @ApiResponse({
    status: 403,
    description: 'Invalid login or password',
    type: HttpErrorResponseDto,
  })
  @ApiTooManyRequests()
  async login(@Req() request: Request, @Body() dto: LoginDto) {
    this.authService.assertRateLimit(request.ip, AUTH_RATE_LIMIT.endpointLogin);
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange refresh token for new token pair' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiBadRequestValidation()
  @ApiResponse({
    status: 401,
    description: 'Missing refresh token in body',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid or expired refresh token',
    type: HttpErrorResponseDto,
  })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: 'Invalidate refresh token (requires access Bearer token)',
  })
  @ApiOkResponse({ type: LogoutOkResponseDto })
  @ApiBadRequestValidation()
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — invalid or missing Bearer access token',
    type: HttpErrorResponseDto,
  })
  logout(@Body() dto: LogoutDto) {
    this.authService.logout(dto.refreshToken);
    return { status: 'ok' };
  }
}
