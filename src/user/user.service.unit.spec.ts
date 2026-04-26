import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

import * as bcrypt from 'bcrypt';

const makePrismaUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-user-1',
  login: 'alice',
  password: '$2b$10$hashed',
  role: 'viewer',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('UserService', () => {
  let service: UserService;
  let prismaMock: {
    user: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('findAll', () => {
    it('returns all users without the password field', async () => {
      prismaMock.user.findMany.mockResolvedValue([makePrismaUser()]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].login).toBe('alice');
    });

    it('returns empty array when no users exist', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns user without password when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makePrismaUser());

      const result = await service.findById('uuid-user-1');

      expect(result.id).toBe('uuid-user-1');
      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findRawByLogin', () => {
    it('returns full user including password when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makePrismaUser());

      const result = await service.findRawByLogin('alice');

      expect(result).not.toBeNull();
      expect(result?.password).toBe('$2b$10$hashed');
    });

    it('returns null when login does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.findRawByLogin('nobody');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates user with hashed password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$hashed$' as never);
      prismaMock.user.create.mockResolvedValue(
        makePrismaUser({ password: '$hashed$' }),
      );

      await service.create({ login: 'alice', password: 'plaintext' });

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', expect.any(Number));
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: '$hashed$' }),
        }),
      );
    });

    it('assigns VIEWER role when no role is provided', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$hashed$' as never);
      prismaMock.user.create.mockResolvedValue(makePrismaUser());

      await service.create({ login: 'alice', password: 'pass' });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'viewer' }),
        }),
      );
    });

    it('assigns provided role when specified', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$hashed$' as never);
      prismaMock.user.create.mockResolvedValue(
        makePrismaUser({ role: 'admin' }),
      );

      await service.create({
        login: 'admin',
        password: 'pass',
        role: UserRole.ADMIN,
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'admin' }),
        }),
      );
    });

    it('throws BadRequestException for duplicate login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makePrismaUser());

      await expect(
        service.create({ login: 'alice', password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns user without password field', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$hashed$' as never);
      prismaMock.user.create.mockResolvedValue(makePrismaUser());

      const result = await service.create({ login: 'alice', password: 'pass' });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    it('updates password when old password is correct', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makePrismaUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('$new-hash$' as never);
      prismaMock.user.update.mockResolvedValue(
        makePrismaUser({ password: '$new-hash$' }),
      );

      const result = await service.update('uuid-user-1', {
        oldPassword: 'old',
        newPassword: 'new',
      });

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
    });

    it('throws ForbiddenException when old password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makePrismaUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.update('uuid-user-1', {
          oldPassword: 'wrongpass',
          newPassword: 'new',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', {
          oldPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes existing user without throwing', async () => {
      const txMock = {
        user: {
          findUnique: vi.fn().mockResolvedValue(makePrismaUser()),
          delete: vi.fn().mockResolvedValue(undefined),
        },
      };
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof txMock) => Promise<void>) => callback(txMock),
      );

      await expect(service.delete('uuid-user-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when user does not exist', async () => {
      const txMock = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          delete: vi.fn(),
        },
      };
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof txMock) => Promise<void>) => callback(txMock),
      );

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hashPassword', () => {
    it('delegates to bcrypt.hash with configured salt', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('$bcrypt-hash$' as never);

      const result = await service.hashPassword('plaintext');

      expect(result).toBe('$bcrypt-hash$');
      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', expect.any(Number));
    });
  });

  describe('comparePassword', () => {
    it('returns true when passwords match', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      expect(await service.comparePassword('plain', 'hashed')).toBe(true);
    });

    it('returns false when passwords do not match', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      expect(await service.comparePassword('wrong', 'hashed')).toBe(false);
    });
  });
});
