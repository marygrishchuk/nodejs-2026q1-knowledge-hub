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
import {
  assertAdmin,
  readAuthenticatedUser,
} from '../common/auth/auth-user.util';
import { CATEGORY_LIST_SORT_FIELDS } from '../common/constants/list-sort-fields.constant';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { assertPaginationPair } from '../common/utils/assert-pagination-pair.util';
import { buildListResponse } from '../common/utils/list-response.util';
import {
  CategoryResponseDto,
  PaginatedCategoriesDto,
} from '../common/swagger/entity-response.swagger.dto';
import {
  ApiBadRequestValidation,
  ApiJwtAuthErrors,
} from '../common/swagger/swagger-common.decorators';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth('Bearer')
@ApiExtraModels(CategoryResponseDto, PaginatedCategoriesDto)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description:
      'With `page`+`limit`: paginated envelope; otherwise plain array.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: getSchemaPath(CategoryResponseDto) },
        },
        { $ref: getSchemaPath(PaginatedCategoriesDto) },
      ],
    },
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
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
  @ApiOperation({ summary: 'Get category by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiJwtAuthErrors({ notFound: true })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create category (admin)' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  async create(@Req() request: Request, @Body() dto: CreateCategoryDto) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdmin(authenticatedUser);
    return this.categoryService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiJwtAuthErrors({ notFound: true })
  @ApiBadRequestValidation()
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
  @ApiOperation({ summary: 'Delete category (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiJwtAuthErrors({ notFound: true })
  async delete(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdmin(authenticatedUser);
    await this.categoryService.delete(id);
  }
}
