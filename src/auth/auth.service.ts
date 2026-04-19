import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../common/enums';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AUTH_DEFAULTS, AUTH_ENV_KEYS, AUTH_MESSAGES } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthJwtPayload, AuthTokens } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async signup(dto: SignupDto): Promise<Omit<CreateUserDto, 'password'> & { id: string }> {
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
