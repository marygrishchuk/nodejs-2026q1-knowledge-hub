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
import { COMMENT_LIST_SORT_FIELDS } from '../common/constants/list-sort-fields.constant';
import { assertPaginationPair } from '../common/utils/assert-pagination-pair.util';
import { buildListResponse } from '../common/utils/list-response.util';
import {
  CommentResponseDto,
  PaginatedCommentsDto,
} from '../common/swagger/entity-response.swagger.dto';
import {
  ApiBadRequestValidation,
  ApiJwtAuthErrors,
} from '../common/swagger/swagger-common.decorators';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CommentService } from './comment.service';
import { CommentListQueryDto } from './dto/comment-list-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth('Bearer')
@ApiExtraModels(CommentResponseDto, PaginatedCommentsDto)
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({
    summary: 'List comments for an article',
    description: '`articleId` query is required.',
  })
  @ApiQuery({ name: 'articleId', required: true, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: getSchemaPath(CommentResponseDto) },
        },
        { $ref: getSchemaPath(PaginatedCommentsDto) },
      ],
    },
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  async findByArticleId(@Query() query: CommentListQueryDto) {
    assertPaginationPair(query);
    const items = await this.commentService.findByArticleId(query.articleId);
    return buildListResponse(items, {
      sortBy: query.sortBy,
      order: query.order,
      page: query.page,
      limit: query.limit,
      allowedSortKeys: COMMENT_LIST_SORT_FIELDS,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiJwtAuthErrors({ notFound: true })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create comment (editor/admin)' })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  async create(@Req() request: Request, @Body() dto: CreateCommentDto) {
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
    return this.commentService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment (editor owns or admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiJwtAuthErrors({ notFound: true })
  async delete(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    if (authenticatedUser.role === UserRole.VIEWER) {
      throw new ForbiddenException('Forbidden resource');
    }
    if (authenticatedUser.role === UserRole.EDITOR) {
      const comment = await this.commentService.findById(id);
      if (comment.authorId !== authenticatedUser.userId) {
        throw new ForbiddenException('Forbidden resource');
      }
    }
    await this.commentService.delete(id);
  }
}
