import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../enums';

export interface AuthenticatedUser {
  userId: string;
  login: string;
  role: UserRole;
}

export function readAuthenticatedUser(request: Request): AuthenticatedUser {
  const requestWithUser = request as Request & {
    user?: { userId?: unknown; login?: unknown; role?: unknown };
  };
  const user = requestWithUser.user;
  if (!user) {
    throw new UnauthorizedException('Unauthorized');
  }

  if (
    typeof user.userId !== 'string' ||
    typeof user.login !== 'string' ||
    !isUserRole(user.role)
  ) {
    throw new UnauthorizedException('Unauthorized');
  }

  return {
    userId: user.userId,
    login: user.login,
    role: user.role,
  };
}

export function assertAdmin(user: AuthenticatedUser): void {
  if (user.role !== UserRole.ADMIN) {
    throw new ForbiddenException('Forbidden resource');
  }
}

export function assertAdminOrSelf(user: AuthenticatedUser, resourceUserId: string): void {
  if (user.role === UserRole.ADMIN || user.userId === resourceUserId) {
    return;
  }
  throw new ForbiddenException('Forbidden resource');
}

export function assertEditorOrAdmin(user: AuthenticatedUser): void {
  if (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN) {
    return;
  }
  throw new ForbiddenException('Forbidden resource');
}

export function assertNotViewer(user: AuthenticatedUser): void {
  if (user.role !== UserRole.VIEWER) {
    return;
  }
  throw new ForbiddenException('Forbidden resource');
}

function isUserRole(role: unknown): role is UserRole {
  return role === UserRole.ADMIN || role === UserRole.EDITOR || role === UserRole.VIEWER;
}
