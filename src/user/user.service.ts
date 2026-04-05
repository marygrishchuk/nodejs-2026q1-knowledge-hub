import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';
import { UserRole } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
  ) {}

  findAll(): Omit<User, 'password'>[] {
    return this.users.map(this.excludePassword);
  }

  findById(id: string): Omit<User, 'password'> {
    const user = this.findRaw(id);
    return this.excludePassword(user);
  }

  findRaw(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  create(dto: CreateUserDto): Omit<User, 'password'> {
    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      login: dto.login,
      password: dto.password,
      role: dto.role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return this.excludePassword(user);
  }

  update(id: string, dto: UpdateUserDto): Omit<User, 'password'> {
    const user = this.findRaw(id);

    if (dto.oldPassword !== undefined || dto.newPassword !== undefined) {
      if (user.password !== dto.oldPassword) {
        throw new ForbiddenException('Old password is incorrect');
      }
      user.password = dto.newPassword;
      user.updatedAt = Date.now();
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
      user.updatedAt = Date.now();
    }

    return this.excludePassword(user);
  }

  delete(id: string): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    this.articleService.nullifyAuthor(id);
    this.commentService.deleteByAuthorId(id);
    this.users.splice(index, 1);
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password: _password, ...rest } = user;
    return rest;
  }
}
