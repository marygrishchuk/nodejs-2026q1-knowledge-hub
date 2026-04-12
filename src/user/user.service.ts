import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '../common/enums';
import { mapUser } from '../prisma/prisma-mappers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './interfaces/user.interface';

const CRYPT_SALT = parseInt(process.env.CRYPT_SALT ?? '10', 10);

const toPrismaUserRole = (role: UserRole): PrismaUserRole =>
  role as unknown as PrismaUserRole;

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

  async findRaw(id: string): Promise<User> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return mapUser(row);
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(dto.password, CRYPT_SALT);
    const row = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        role: toPrismaUserRole(dto.role ?? UserRole.VIEWER),
      },
    });
    return this.excludePassword(mapUser(row));
  }

  async update(
    id: string,
    dto: UpdatePasswordDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findRaw(id);
    const isValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isValid) {
      throw new ForbiddenException('Old password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, CRYPT_SALT);
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
}
