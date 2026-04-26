import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../common/enums';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-user-1',
  login: 'alice',
  password: '$2b$10$hashed',
  role: UserRole.VIEWER,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const makeUserServiceMock = () => ({
  create: vi.fn(),
  findRawByLogin: vi.fn(),
  comparePassword: vi.fn(),
  resetTestUserCredentials: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findRaw: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hashPassword: vi.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userServiceMock: ReturnType<typeof makeUserServiceMock>;

  beforeEach(async () => {
    userServiceMock = makeUserServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('signup', () => {
    it('creates user with VIEWER role', async () => {
      const createdUser = makeUser();
      userServiceMock.create.mockResolvedValue(createdUser);

      const result = await service.signup({
        login: 'alice',
        password: 'pass123',
      });

      expect(userServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.VIEWER }),
      );
      expect(result.id).toBe('uuid-user-1');
      expect(result.login).toBe('alice');
    });

    it('throws BadRequestException when login already exists', async () => {
      userServiceMock.create.mockRejectedValue(
        new BadRequestException('already exists'),
      );

      await expect(
        service.signup({ login: 'alice', password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('re-throws non-BadRequest errors from UserService', async () => {
      userServiceMock.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.signup({ login: 'alice', password: 'pass' }),
      ).rejects.toThrow(Error);
    });
  });

  describe('login', () => {
    it('returns access and refresh tokens for valid credentials', async () => {
      userServiceMock.findRawByLogin.mockResolvedValue(makeUser());
      userServiceMock.comparePassword.mockResolvedValue(true);

      const result = await service.login({
        login: 'alice',
        password: 'pass123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('throws ForbiddenException when user does not exist', async () => {
      userServiceMock.findRawByLogin.mockResolvedValue(null);

      await expect(
        service.login({ login: 'ghost', password: 'pass' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when password is incorrect', async () => {
      userServiceMock.findRawByLogin.mockResolvedValue(makeUser());
      userServiceMock.comparePassword.mockResolvedValue(false);

      await expect(
        service.login({ login: 'alice', password: 'wrongpass' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateTokenPair', () => {
    it('generates verifiable access and refresh tokens', () => {
      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.VIEWER,
      };

      const tokens = service.generateTokenPair(payload);

      const decodedAccess = jwt.verify(
        tokens.accessToken,
        service.getAccessSecret(),
      ) as jwt.JwtPayload;
      const decodedRefresh = jwt.verify(
        tokens.refreshToken,
        service.getRefreshSecret(),
      ) as jwt.JwtPayload;

      expect(decodedAccess.userId).toBe('uuid-user-1');
      expect(decodedRefresh.login).toBe('alice');
    });

    it('embeds userId, login and role in token payload', () => {
      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.EDITOR,
      };

      const tokens = service.generateTokenPair(payload);

      const decoded = jwt.verify(
        tokens.accessToken,
        service.getAccessSecret(),
      ) as jwt.JwtPayload;

      expect(decoded.role).toBe(UserRole.EDITOR);
    });
  });

  describe('verifyRefreshToken', () => {
    it('returns payload for a valid refresh token', () => {
      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.VIEWER,
      };
      const validToken = jwt.sign(payload, service.getRefreshSecret(), {
        expiresIn: '1h',
      });

      const result = service.verifyRefreshToken(validToken);

      expect(result.userId).toBe('uuid-user-1');
      expect(result.login).toBe('alice');
    });

    it('throws ForbiddenException for an expired refresh token', () => {
      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.VIEWER,
      };
      const expiredToken = jwt.sign(payload, service.getRefreshSecret(), {
        expiresIn: '-1s',
      });

      expect(() => service.verifyRefreshToken(expiredToken)).toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for a tampered refresh token', () => {
      const tamperedToken = 'tampered.token.value';

      expect(() => service.verifyRefreshToken(tamperedToken)).toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when token payload is missing required fields', () => {
      const incompleteToken = jwt.sign(
        { sub: 'some-id' },
        service.getRefreshSecret(),
        { expiresIn: '1h' },
      );

      expect(() => service.verifyRefreshToken(incompleteToken)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('refresh', () => {
    it('returns new token pair for valid refresh token', () => {
      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.VIEWER,
      };
      const validToken = jwt.sign(payload, service.getRefreshSecret(), {
        expiresIn: '1h',
      });

      const result = service.refresh(validToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException when refresh token is undefined', () => {
      expect(() => service.refresh(undefined)).toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException for an invalid refresh token', () => {
      expect(() => service.refresh('invalid.token')).toThrow(
        ForbiddenException,
      );
    });

    it('invalidates used refresh token (rotation)', () => {
      const originalEnv = process.env.TEST_MODE;
      delete process.env.TEST_MODE;

      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.VIEWER,
      };
      const validToken = jwt.sign(payload, service.getRefreshSecret(), {
        expiresIn: '1h',
      });

      service.refresh(validToken);

      expect(() => service.refresh(validToken)).toThrow(ForbiddenException);

      process.env.TEST_MODE = originalEnv;
    });
  });

  describe('logout', () => {
    it('completes without error for a valid refresh token', () => {
      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.VIEWER,
      };
      const validToken = jwt.sign(payload, service.getRefreshSecret(), {
        expiresIn: '1h',
      });

      expect(() => service.logout(validToken)).not.toThrow();
    });

    it('throws UnauthorizedException when refresh token is undefined', () => {
      expect(() => service.logout(undefined)).toThrow(UnauthorizedException);
    });
  });

  describe('assertRateLimit', () => {
    it('does not throw when rate limit is not exceeded', () => {
      const originalEnv = process.env.TEST_MODE;
      delete process.env.TEST_MODE;

      expect(() => service.assertRateLimit('127.0.0.1', 'login')).not.toThrow();

      process.env.TEST_MODE = originalEnv;
    });

    it('throws TooManyRequests when limit is exceeded', () => {
      const originalEnv = process.env.TEST_MODE;
      delete process.env.TEST_MODE;

      for (let attempt = 0; attempt < 20; attempt++) {
        service.assertRateLimit('1.2.3.4', 'signup');
      }

      expect(() => service.assertRateLimit('1.2.3.4', 'signup')).toThrow(
        HttpException,
      );

      process.env.TEST_MODE = originalEnv;
    });

    it('skips rate limit check in TEST_MODE=auth', () => {
      const originalEnv = process.env.TEST_MODE;
      process.env.TEST_MODE = 'auth';

      for (let attempt = 0; attempt < 100; attempt++) {
        expect(() => service.assertRateLimit('1.2.3.4', 'login')).not.toThrow();
      }

      process.env.TEST_MODE = originalEnv;
    });
  });

  describe('RBAC — role assignment', () => {
    it('assigns VIEWER role on signup regardless of requested role', async () => {
      const createdUser = makeUser({ role: UserRole.VIEWER });
      userServiceMock.create.mockResolvedValue(createdUser);

      const result = await service.signup({
        login: 'newuser',
        password: 'pass',
      });

      expect(result.role).toBe(UserRole.VIEWER);
    });

    it('embeds user role from DB in generated token', () => {
      const payload = {
        userId: 'uuid-user-1',
        login: 'alice',
        role: UserRole.ADMIN,
      };

      const tokens = service.generateTokenPair(payload);

      const decoded = jwt.verify(
        tokens.accessToken,
        service.getAccessSecret(),
      ) as jwt.JwtPayload;

      expect(decoded.role).toBe(UserRole.ADMIN);
    });
  });
});
