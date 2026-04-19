import {
  ArticleStatus as PrismaArticleStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import { ArticleStatus, UserRole } from '../common/enums';

export const apiUserRoleToPrisma = (
  role: UserRole | string,
): PrismaUserRole => {
  switch (role) {
    case UserRole.ADMIN:
      return PrismaUserRole.ADMIN;
    case UserRole.EDITOR:
      return PrismaUserRole.EDITOR;
    case UserRole.VIEWER:
      return PrismaUserRole.VIEWER;
    default:
      return PrismaUserRole.VIEWER;
  }
};

export const prismaUserRoleToApi = (role: PrismaUserRole): UserRole => {
  const r = String(role).toLowerCase();
  if (r === 'admin') return UserRole.ADMIN;
  if (r === 'editor') return UserRole.EDITOR;
  return UserRole.VIEWER;
};

export const apiArticleStatusToPrisma = (
  status: ArticleStatus | string,
): PrismaArticleStatus => {
  switch (status) {
    case ArticleStatus.DRAFT:
      return PrismaArticleStatus.DRAFT;
    case ArticleStatus.PUBLISHED:
      return PrismaArticleStatus.PUBLISHED;
    case ArticleStatus.ARCHIVED:
      return PrismaArticleStatus.ARCHIVED;
    default:
      return PrismaArticleStatus.DRAFT;
  }
};

export const prismaArticleStatusToApi = (
  status: PrismaArticleStatus,
): ArticleStatus => {
  const s = String(status).toLowerCase();
  if (s === 'published') return ArticleStatus.PUBLISHED;
  if (s === 'archived') return ArticleStatus.ARCHIVED;
  return ArticleStatus.DRAFT;
};
