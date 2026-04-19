import {
  Body,
  Controller,
  Delete,
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
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { assertAdmin, readAuthenticatedUser } from '../common/auth/auth-user.util';
import { CATEGORY_LIST_SORT_FIELDS } from '../common/constants/list-sort-fields.constant';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { assertPaginationPair } from '../common/utils/assert-pagination-pair.util';
import { buildListResponse } from '../common/utils/list-response.util';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: ListQueryDto) {
    assertPaginationPair(query);
    const items = await this.categoryService.findAll();
    return buildListResponse(items, {
      sortBy: query.sortBy,
      order: query.order,
      page: query.page,
      limit: query.limit,
      allowedSortKeys: CATEGORY_LIST_SORT_FIELDS,
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() request: Request, @Body() dto: CreateCategoryDto) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdmin(authenticatedUser);
    return this.categoryService.create(dto);
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdmin(authenticatedUser);
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() request: Request, @Param('id', ParseUUIDPipe) id: string) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdmin(authenticatedUser);
    await this.categoryService.delete(id);
  }
}
