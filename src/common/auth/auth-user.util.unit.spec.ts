import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { UserRole } from '../enums';
import {
  assertAdmin,
  assertAdminOrSelf,
  assertEditorOrAdmin,
  assertNotViewer,
  readAuthenticatedUser,
} from './auth-user.util';

const makeRequest = (user?: unknown) =>
  ({ user } as unknown as Request);

const makeAuthUser = (role: UserRole, userId = 'uuid-user-1') => ({
  userId,
  login: 'alice',
  role,
});

describe('readAuthenticatedUser', () => {
  it('returns authenticated user when request has valid user payload', () => {
    const request = makeRequest({
      userId: 'uuid-user-1',
      login: 'alice',
      role: UserRole.ADMIN,
    });

    const result = readAuthenticatedUser(request);

    expect(result.userId).toBe('uuid-user-1');
    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('throws UnauthorizedException when user is absent from request', () => {
    const request = makeRequest(undefined);

    expect(() => readAuthenticatedUser(request)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when userId is not a string', () => {
    const request = makeRequest({ userId: 123, login: 'alice', role: UserRole.VIEWER });

    expect(() => readAuthenticatedUser(request)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when role is not a valid UserRole', () => {
    const request = makeRequest({
      userId: 'uuid-user-1',
      login: 'alice',
      role: 'superuser',
    });

    expect(() => readAuthenticatedUser(request)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when login is not a string', () => {
    const request = makeRequest({
      userId: 'uuid-user-1',
      login: 99,
      role: UserRole.VIEWER,
    });

    expect(() => readAuthenticatedUser(request)).toThrow(UnauthorizedException);
  });
});

describe('assertAdmin', () => {
  it('does not throw when user has ADMIN role', () => {
    expect(() => assertAdmin(makeAuthUser(UserRole.ADMIN))).not.toThrow();
  });

  it('throws ForbiddenException when user has EDITOR role', () => {
    expect(() => assertAdmin(makeAuthUser(UserRole.EDITOR))).toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when user has VIEWER role', () => {
    expect(() => assertAdmin(makeAuthUser(UserRole.VIEWER))).toThrow(
      ForbiddenException,
    );
  });
});

describe('assertAdminOrSelf', () => {
  it('does not throw when user is ADMIN', () => {
    expect(() =>
      assertAdminOrSelf(makeAuthUser(UserRole.ADMIN, 'any-id'), 'other-uuid'),
    ).not.toThrow();
  });

  it('does not throw when user is accessing their own resource', () => {
    expect(() =>
      assertAdminOrSelf(makeAuthUser(UserRole.VIEWER, 'uuid-user-1'), 'uuid-user-1'),
    ).not.toThrow();
  });

  it('throws ForbiddenException when VIEWER tries to access another user resource', () => {
    expect(() =>
      assertAdminOrSelf(makeAuthUser(UserRole.VIEWER, 'uuid-user-1'), 'uuid-other'),
    ).toThrow(ForbiddenException);
  });
});

describe('assertEditorOrAdmin', () => {
  it('does not throw when user has EDITOR role', () => {
    expect(() => assertEditorOrAdmin(makeAuthUser(UserRole.EDITOR))).not.toThrow();
  });

  it('does not throw when user has ADMIN role', () => {
    expect(() => assertEditorOrAdmin(makeAuthUser(UserRole.ADMIN))).not.toThrow();
  });

  it('throws ForbiddenException when user has VIEWER role', () => {
    expect(() => assertEditorOrAdmin(makeAuthUser(UserRole.VIEWER))).toThrow(
      ForbiddenException,
    );
  });
});

describe('assertNotViewer', () => {
  it('does not throw when user has ADMIN role', () => {
    expect(() => assertNotViewer(makeAuthUser(UserRole.ADMIN))).not.toThrow();
  });

  it('does not throw when user has EDITOR role', () => {
    expect(() => assertNotViewer(makeAuthUser(UserRole.EDITOR))).not.toThrow();
  });

  it('throws ForbiddenException when user has VIEWER role', () => {
    expect(() => assertNotViewer(makeAuthUser(UserRole.VIEWER))).toThrow(
      ForbiddenException,
    );
  });
});
