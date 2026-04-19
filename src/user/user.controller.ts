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
import {
  assertAdmin,
  assertAdminOrSelf,
  readAuthenticatedUser,
} from '../common/auth/auth-user.util';
import { USER_LIST_SORT_FIELDS } from '../common/constants/list-sort-fields.constant';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { assertPaginationPair } from '../common/utils/assert-pagination-pair.util';
import { buildListResponse } from '../common/utils/list-response.util';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
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
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() request: Request, @Body() dto: CreateUserDto) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdmin(authenticatedUser);
    return this.userService.create(dto);
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdminOrSelf(authenticatedUser, id);
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() request: Request, @Param('id', ParseUUIDPipe) id: string) {
    const authenticatedUser = readAuthenticatedUser(request);
    assertAdminOrSelf(authenticatedUser, id);
    await this.userService.delete(id);
  }
}
