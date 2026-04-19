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
      return PrismaUserRole.admin;
    case UserRole.EDITOR:
      return PrismaUserRole.editor;
    case UserRole.VIEWER:
      return PrismaUserRole.viewer;
    default:
      return PrismaUserRole.viewer;
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
      return PrismaArticleStatus.draft;
    case ArticleStatus.PUBLISHED:
      return PrismaArticleStatus.published;
    case ArticleStatus.ARCHIVED:
      return PrismaArticleStatus.archived;
    default:
      return PrismaArticleStatus.draft;
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
