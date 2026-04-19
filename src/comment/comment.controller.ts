import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { COMMENT_LIST_SORT_FIELDS } from '../common/constants/list-sort-fields.constant';
import { assertPaginationPair } from '../common/utils/assert-pagination-pair.util';
import { buildListResponse } from '../common/utils/list-response.util';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CommentService } from './comment.service';
import { CommentListQueryDto } from './dto/comment-list-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiQuery({ name: 'articleId', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
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
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCommentDto) {
    return this.commentService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.commentService.delete(id);
  }
}
