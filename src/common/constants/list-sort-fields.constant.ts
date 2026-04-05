export const USER_LIST_SORT_FIELDS = [
  'id',
  'login',
  'role',
  'createdAt',
  'updatedAt',
] as const;

export const ARTICLE_LIST_SORT_FIELDS = [
  'id',
  'title',
  'content',
  'status',
  'authorId',
  'categoryId',
  'createdAt',
  'updatedAt',
] as const;

export const CATEGORY_LIST_SORT_FIELDS = ['id', 'name', 'description'] as const;

export const COMMENT_LIST_SORT_FIELDS = [
  'id',
  'content',
  'articleId',
  'authorId',
  'createdAt',
] as const;
