import { Article as PrismaArticle, Comment, Tag, User } from '@prisma/client';
import { Article } from '../article/interfaces/article.interface';
import { Comment as CommentModel } from '../comment/interfaces/comment.interface';
import { User as UserModel } from '../user/interfaces/user.interface';
import { prismaArticleStatusToApi, prismaUserRoleToApi } from './prisma-enums';

export type ArticleWithTags = PrismaArticle & { tags: Tag[] };

export const mapArticle = (row: ArticleWithTags): Article => ({
  id: row.id,
  title: row.title,
  content: row.content,
  status: prismaArticleStatusToApi(row.status),
  authorId: row.authorId,
  categoryId: row.categoryId,
  tags: row.tags.map((t) => t.name),
  createdAt: row.createdAt.getTime(),
  updatedAt: row.updatedAt.getTime(),
});

export const mapUser = (row: User): UserModel => ({
  id: row.id,
  login: row.login,
  password: row.password,
  role: prismaUserRoleToApi(row.role),
  createdAt: row.createdAt.getTime(),
  updatedAt: row.updatedAt.getTime(),
});

export const mapComment = (row: Comment): CommentModel => ({
  id: row.id,
  content: row.content,
  articleId: row.articleId,
  authorId: row.authorId,
  createdAt: row.createdAt.getTime(),
});
