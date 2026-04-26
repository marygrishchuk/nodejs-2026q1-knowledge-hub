import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../auth/auth.service';
import { AccessTokenGuard } from './access-token.guard';

const makeContext = (headers: Record<string, string> = {}, method = 'GET', path = '/article') =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers,
        method,
        path,
        url: path,
      }),
    }),
  }) as unknown as ExecutionContext;

const makeAuthServiceMock = () => ({
  getAccessSecret: vi.fn().mockReturnValue('test-access-secret'),
  getRefreshSecret: vi.fn().mockReturnValue('test-refresh-secret'),
});

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let authServiceMock: ReturnType<typeof makeAuthServiceMock>;

  beforeEach(async () => {
    authServiceMock = makeAuthServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenGuard,
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    guard = module.get<AccessTokenGuard>(AccessTokenGuard);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows OPTIONS requests without checking token', () => {
    const context = makeContext({}, 'OPTIONS', '/article');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests to public signup path without token', () => {
    const context = makeContext({}, 'POST', '/auth/signup');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests to public login path without token', () => {
    const context = makeContext({}, 'POST', '/auth/login');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests to public refresh path without token', () => {
    const context = makeContext({}, 'POST', '/auth/refresh');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests to root path without token', () => {
    const context = makeContext({}, 'GET', '/');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests to swagger docs without token', () => {
    const context = makeContext({}, 'GET', '/doc');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('passes and attaches user when a valid bearer token is provided', () => {
    const payload = { userId: 'uuid-1', login: 'alice', role: 'viewer' };
    const token = jwt.sign(payload, 'test-access-secret', { expiresIn: '1h' });
    const context = makeContext({ authorization: `Bearer ${token}` });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws UnauthorizedException when authorization header is missing', () => {
    const context = makeContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when authorization header does not use Bearer scheme', () => {
    const context = makeContext({ authorization: 'Basic dXNlcjpwYXNz' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when bearer token is empty string', () => {
    const context = makeContext({ authorization: 'Bearer ' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is malformed', () => {
    const context = makeContext({ authorization: 'Bearer not.a.valid.token' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is expired', () => {
    const payload = { userId: 'uuid-1', login: 'alice', role: 'viewer' };
    const expiredToken = jwt.sign(payload, 'test-access-secret', {
      expiresIn: '-1s',
    });
    const context = makeContext({ authorization: `Bearer ${expiredToken}` });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is signed with wrong secret', () => {
    const payload = { userId: 'uuid-1', login: 'alice', role: 'viewer' };
    const tokenWithWrongSecret = jwt.sign(payload, 'wrong-secret', {
      expiresIn: '1h',
    });
    const context = makeContext({
      authorization: `Bearer ${tokenWithWrongSecret}`,
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
