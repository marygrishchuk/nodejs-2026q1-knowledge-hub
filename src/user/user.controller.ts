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
  assertAdminOrSelf,
  assertNotViewer,
  readAuthenticatedUser,
} from '../common/auth/auth-user.util';
import { USER_LIST_SORT_FIELDS } from '../common/constants/list-sort-fields.constant';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { assertPaginationPair } from '../common/utils/assert-pagination-pair.util';
import { buildListResponse } from '../common/utils/list-response.util';
import {
  PaginatedUsersDto,
  UserResponseDto,
} from '../common/swagger/entity-response.swagger.dto';
import {
  ApiBadRequestValidation,
  ApiJwtAuthErrors,
} from '../common/swagger/swagger-common.decorators';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('Bearer')
@ApiExtraModels(UserResponseDto, PaginatedUsersDto)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description:
      'With `page`+`limit`: paginated envelope; otherwise plain array. Passwords are never returned.',
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
          items: { $ref: getSchemaPath(UserResponseDto) },
        },
        { $ref: getSchemaPath(PaginatedUsersDto) },
      ],
    },
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  async findAll(@Query() query: ListQueryDto) {
    assertPaginationPair(query);
    const items = await this.userService.findAll();
    return buildListResponse(items, {
      sortBy: query.sortBy,
      order: query.order,
      page: query.page,
      limit: query.limit,
      allowedSortKeys: USER_LIST_SORT_FIELDS,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (no password)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiJwtAuthErrors({ notFound: true })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user (admin)' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  async create(@Req() request: Request, @Body() dto: CreateUserDto) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdmin(authenticatedUser);
    return this.userService.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update password (admin or self; viewer cannot)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiJwtAuthErrors({ notFound: true })
  @ApiBadRequestValidation()
  async update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertNotViewer(authenticatedUser);
    assertAdminOrSelf(authenticatedUser, id);
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (admin or self; viewer cannot)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiJwtAuthErrors({ notFound: true })
  async delete(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertNotViewer(authenticatedUser);
    assertAdminOrSelf(authenticatedUser, id);
    await this.userService.delete(id);
  }
}
