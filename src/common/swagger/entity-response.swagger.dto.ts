import { ApiProperty } from '@nestjs/swagger';
import { ArticleStatus, UserRole } from '../enums';

export class ArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: ArticleStatus })
  status: ArticleStatus;

  @ApiProperty({ format: 'uuid', nullable: true })
  authorId: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  categoryId: string | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Unix timestamp (ms)' })
  createdAt: number;

  @ApiProperty({ description: 'Unix timestamp (ms)' })
  updatedAt: number;
}

export class PaginatedArticlesDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: ArticleResponseDto, isArray: true })
  data: ArticleResponseDto[];
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  login: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Unix timestamp (ms)' })
  createdAt: number;

  @ApiProperty({ description: 'Unix timestamp (ms)' })
  updatedAt: number;
}

export class PaginatedUsersDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: UserResponseDto, isArray: true })
  data: UserResponseDto[];
}

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}

export class PaginatedCategoriesDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: CategoryResponseDto, isArray: true })
  data: CategoryResponseDto[];
}

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  authorId: string | null;

  @ApiProperty({ description: 'Unix timestamp (ms)' })
  createdAt: number;
}

export class PaginatedCommentsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: CommentResponseDto, isArray: true })
  data: CommentResponseDto[];
}

export class AuthTokensResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}

export class SignupResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  login: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

export class LogoutOkResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;
}
