import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';
import { UserRole } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './interfaces/user.interface';

const CRYPT_SALT = parseInt(process.env.CRYPT_SALT ?? '10', 10);

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

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const now = Date.now();
    const hashedPassword = await bcrypt.hash(dto.password, CRYPT_SALT);
    const user: User = {
      id: randomUUID(),
      login: dto.login,
      password: hashedPassword,
      role: dto.role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return this.excludePassword(user);
  }

  async update(
    id: string,
    dto: UpdatePasswordDto,
  ): Promise<Omit<User, 'password'>> {
    const user = this.findRaw(id);
    const isValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isValid) {
      throw new ForbiddenException('Old password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, CRYPT_SALT);
    user.updatedAt = Date.now();
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
    const { id, login, role, createdAt, updatedAt } = user;
    return { id, login, role, createdAt, updatedAt };
  }
}
