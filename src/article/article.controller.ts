import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { readAuthenticatedUser } from '../common/auth/auth-user.util';
import { UserRole } from '../common/enums';
import { ARTICLE_LIST_SORT_FIELDS } from '../common/constants/list-sort-fields.constant';
import { assertPaginationPair } from '../common/utils/assert-pagination-pair.util';
import { buildListResponse } from '../common/utils/list-response.util';
import { ArticleStatus } from '../common/enums';
import {
  ArticleResponseDto,
  PaginatedArticlesDto,
} from '../common/swagger/entity-response.swagger.dto';
import {
  ApiBadRequestValidation,
  ApiJwtAuthErrors,
} from '../common/swagger/swagger-common.decorators';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { ArticleService } from './article.service';
import { ArticleListQueryDto } from './dto/article-list-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Articles')
@ApiBearerAuth('Bearer')
@ApiExtraModels(ArticleResponseDto, PaginatedArticlesDto)
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({
    summary: 'List articles',
    description:
      'Optional filters. Send both `page` and `limit` for paginated `{ total, page, limit, data }`; otherwise a plain array.',
  })
  @ApiQuery({ name: 'status', enum: ArticleStatus, required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({
    description:
      'Article array, or paginated wrapper when `page` and `limit` are both provided.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: getSchemaPath(ArticleResponseDto) },
        },
        { $ref: getSchemaPath(PaginatedArticlesDto) },
      ],
    },
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  async findAll(@Query() query: ArticleListQueryDto) {
    assertPaginationPair(query);
    const items = await this.articleService.findAll(query);
    return buildListResponse(items, {
      sortBy: query.sortBy,
      order: query.order,
      page: query.page,
      limit: query.limit,
      allowedSortKeys: ARTICLE_LIST_SORT_FIELDS,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiJwtAuthErrors({ notFound: true })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create article (editor/admin)' })
  @ApiCreatedResponse({ type: ArticleResponseDto })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  async create(@Req() request: Request, @Body() dto: CreateArticleDto) {
    const authenticatedUser = readAuthenticatedUser(request);
    if (authenticatedUser.role === UserRole.VIEWER) {
      throw new ForbiddenException('Forbidden resource');
    }
    if (
      authenticatedUser.role === UserRole.EDITOR &&
      dto.authorId !== authenticatedUser.userId
    ) {
      throw new ForbiddenException('Forbidden resource');
    }
    return this.articleService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update article (editor owns article or admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiJwtAuthErrors({ notFound: true })
  @ApiBadRequestValidation()
  async update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    if (authenticatedUser.role === UserRole.VIEWER) {
      throw new ForbiddenException('Forbidden resource');
    }
    if (authenticatedUser.role === UserRole.EDITOR) {
      const article = await this.articleService.findById(id);
      if (article.authorId !== authenticatedUser.userId) {
        throw new ForbiddenException('Forbidden resource');
      }
      if (dto.authorId && dto.authorId !== authenticatedUser.userId) {
        throw new ForbiddenException('Forbidden resource');
      }
    }
    return this.articleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete article (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Article removed' })
  @ApiJwtAuthErrors({ notFound: true })
  async delete(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Forbidden resource');
    }
    await this.articleService.delete(id);
  }
}
