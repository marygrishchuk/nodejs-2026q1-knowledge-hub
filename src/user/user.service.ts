import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums';
import { apiUserRoleToPrisma } from '../prisma/prisma-enums';
import { mapUser } from '../prisma/prisma-mappers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './interfaces/user.interface';

const CRYPT_SALT = parseInt(process.env.CRYPT_SALT ?? '10', 10);

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const rows = await this.prisma.user.findMany();
    return rows.map((row) => this.excludePassword(mapUser(row)));
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findRaw(id);
    return this.excludePassword(user);
  }

  async findRawByLogin(login: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { login } });
    if (!row) {
      return null;
    }
    return mapUser(row);
  }

  async findRaw(id: string): Promise<User> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return mapUser(row);
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.findRawByLogin(dto.login);
    if (existingUser) {
      throw new BadRequestException(
        `User with login ${dto.login} already exists`,
      );
    }
    const hashedPassword = await this.hashPassword(dto.password);
    const row = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        role: apiUserRoleToPrisma(dto.role ?? UserRole.VIEWER),
      },
    });
    return this.excludePassword(mapUser(row));
  }

  async resetTestUserCredentials(
    login: string,
    password: string,
    role: UserRole,
  ): Promise<Omit<User, 'password'> | null> {
    const existingUser = await this.findRawByLogin(login);
    if (!existingUser) {
      return null;
    }
    const hashedPassword = await this.hashPassword(password);
    const row = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
        role: apiUserRoleToPrisma(role),
      },
    });
    return this.excludePassword(mapUser(row));
  }

  async update(
    id: string,
    dto: UpdatePasswordDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findRaw(id);
    const isValid = await this.comparePassword(dto.oldPassword, user.password);
    if (!isValid) {
      throw new ForbiddenException('Old password is incorrect');
    }
    const hashedPassword = await this.hashPassword(dto.newPassword);
    const row = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return this.excludePassword(mapUser(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.user.findUnique({ where: { id } });
      if (!row) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      await tx.user.delete({ where: { id } });
    });
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    const { id, login, role, createdAt, updatedAt } = user;
    return { id, login, role, createdAt, updatedAt };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, CRYPT_SALT);
  }

  async comparePassword(
    rawPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(rawPassword, hashedPassword);
  }
}
