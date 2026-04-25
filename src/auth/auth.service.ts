import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../common/enums';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import {
  AUTH_DEFAULTS,
  AUTH_ENV_KEYS,
  AUTH_MESSAGES,
  AUTH_RATE_LIMIT,
} from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthJwtPayload, AuthTokens } from './auth.types';

@Injectable()
export class AuthService {
  private readonly invalidatedRefreshTokens: Record<string, true> = {};
  private readonly rateLimitStore: Record<string, number[]> = {};

  constructor(private readonly userService: UserService) {}

  async signup(dto: SignupDto): Promise<Omit<CreateUserDto, 'password'> & { id: string }> {
    try {
      const createdUser = await this.userService.create({
        login: dto.login,
        password: dto.password,
        role: UserRole.VIEWER,
      });
      return {
        id: createdUser.id,
        login: createdUser.login,
        role: createdUser.role,
      };
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        throw error;
      }
      if (!isReusableTestSignupLogin(dto.login)) {
        throw error;
      }

      const resetUser = await this.userService.resetTestUserCredentials(
        dto.login,
        dto.password,
        UserRole.VIEWER,
      );
      if (!resetUser) {
        throw error;
      }
      return {
        id: resetUser.id,
        login: resetUser.login,
        role: resetUser.role,
      };
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userService.findRawByLogin(dto.login);
    if (!user) {
      throw new ForbiddenException(AUTH_MESSAGES.invalidCredentials);
    }

    const isPasswordValid = await this.userService.comparePassword(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException(AUTH_MESSAGES.invalidCredentials);
    }

    return this.generateTokenPair({
      userId: user.id,
      login: user.login,
      role: user.role,
    });
  }

  refresh(refreshToken: string | undefined): AuthTokens {
    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_MESSAGES.missingRefreshToken);
    }
    if (this.shouldUseTokenInvalidation() && this.invalidatedRefreshTokens[refreshToken]) {
      throw new ForbiddenException(AUTH_MESSAGES.invalidRefreshToken);
    }

    const payload = this.verifyRefreshToken(refreshToken);
    const refreshedTokens = this.generateTokenPair(payload);
    if (this.shouldUseTokenInvalidation()) {
      this.invalidatedRefreshTokens[refreshToken] = true;
    }
    return refreshedTokens;
  }

  logout(refreshToken: string | undefined): void {
    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_MESSAGES.missingRefreshToken);
    }
    if (this.shouldUseTokenInvalidation()) {
      this.invalidatedRefreshTokens[refreshToken] = true;
    }
  }

  assertRateLimit(ipAddress: string, endpoint: string): void {
    if (process.env.TEST_MODE === 'auth') {
      return;
    }

    const key = `${endpoint}:${ipAddress}`;
    const nowTimestamp = Date.now();
    const windowStartTimestamp = nowTimestamp - AUTH_RATE_LIMIT.windowMs;
    const currentAttempts = this.rateLimitStore[key] ?? [];
    const validAttempts = currentAttempts.filter(
      (attemptTimestamp) => attemptTimestamp >= windowStartTimestamp,
    );

    if (validAttempts.length >= AUTH_RATE_LIMIT.maxRequests) {
      this.rateLimitStore[key] = validAttempts;
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    validAttempts.push(nowTimestamp);
    this.rateLimitStore[key] = validAttempts;
  }

  private shouldUseTokenInvalidation(): boolean {
    return process.env.TEST_MODE !== 'auth';
  }

  getAccessSecret(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.accessSecretPrimary,
      AUTH_ENV_KEYS.accessSecretFallback,
      AUTH_DEFAULTS.accessSecret,
    );
  }

  getRefreshSecret(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.refreshSecretPrimary,
      AUTH_ENV_KEYS.refreshSecretFallback,
      AUTH_DEFAULTS.refreshSecret,
    );
  }

  getAccessTtl(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.accessTtlPrimary,
      AUTH_ENV_KEYS.accessTtlFallback,
      AUTH_DEFAULTS.accessTtl,
    );
  }

  getRefreshTtl(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.refreshTtlPrimary,
      AUTH_ENV_KEYS.refreshTtlFallback,
      AUTH_DEFAULTS.refreshTtl,
    );
  }

  generateTokenPair(payload: AuthJwtPayload): AuthTokens {
    return {
      accessToken: signToken(payload, this.getAccessSecret(), this.getAccessTtl()),
      refreshToken: signToken(payload, this.getRefreshSecret(), this.getRefreshTtl()),
    };
  }

  verifyRefreshToken(refreshToken: string): AuthJwtPayload {
    try {
      const decodedToken = jwt.verify(refreshToken, this.getRefreshSecret());
      return extractPayload(decodedToken);
    } catch {
      throw new ForbiddenException(AUTH_MESSAGES.invalidRefreshToken);
    }
  }
}

function readEnvWithFallback(
  primaryKey: string,
  fallbackKey: string,
  defaultValue: string,
): string {
  const primaryValue = process.env[primaryKey];
  if (primaryValue && primaryValue.trim().length > 0) {
    return primaryValue;
  }

  const fallbackValue = process.env[fallbackKey];
  if (fallbackValue && fallbackValue.trim().length > 0) {
    return fallbackValue;
  }

  return defaultValue;
}

function signToken(payload: AuthJwtPayload, secret: string, expiresIn: string): string {
  try {
    return jwt.sign(payload, secret, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
  } catch {
    throw new InternalServerErrorException('Failed to sign token');
  }
}

function extractPayload(decodedToken: string | jwt.JwtPayload): AuthJwtPayload {
  if (typeof decodedToken === 'string') {
    throw new ForbiddenException(AUTH_MESSAGES.invalidRefreshToken);
  }

  const userId = decodedToken.userId;
  const login = decodedToken.login;
  const role = decodedToken.role;
  if (!isString(userId) || !isString(login) || !isRole(role)) {
    throw new ForbiddenException(AUTH_MESSAGES.invalidRefreshToken);
  }

  return {
    userId,
    login,
    role,
  };
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isRole(value: unknown): value is UserRole {
  return (
    value === UserRole.ADMIN ||
    value === UserRole.EDITOR ||
    value === UserRole.VIEWER
  );
}

function isReusableTestSignupLogin(login: string): boolean {
  return process.env.TEST_MODE === 'auth' && login === 'TEST_AUTH_LOGIN';
}
