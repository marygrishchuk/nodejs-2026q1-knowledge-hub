import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryService } from './category.service';

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-cat-1',
  name: 'NestJS',
  description: 'NestJS articles',
  ...overrides,
});

describe('CategoryService', () => {
  let service: CategoryService;
  let prismaMock: {
    category: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      prismaMock.category.findMany.mockResolvedValue([makeCategory()]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('NestJS');
    });

    it('returns empty array when no categories exist', async () => {
      prismaMock.category.findMany.mockResolvedValue([]);

      expect(await service.findAll()).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns category when found', async () => {
      prismaMock.category.findUnique.mockResolvedValue(makeCategory());

      const result = await service.findById('uuid-cat-1');

      expect(result.id).toBe('uuid-cat-1');
    });

    it('throws NotFoundException when category does not exist', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns new category', async () => {
      prismaMock.category.create.mockResolvedValue(makeCategory());

      const result = await service.create({
        name: 'NestJS',
        description: 'NestJS articles',
      });

      expect(result.name).toBe('NestJS');
      expect(prismaMock.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'NestJS', description: 'NestJS articles' },
        }),
      );
    });
  });

  describe('update', () => {
    it('updates category when it exists', async () => {
      prismaMock.category.findUnique.mockResolvedValue(makeCategory());
      prismaMock.category.update.mockResolvedValue(
        makeCategory({ name: 'Updated' }),
      );

      const result = await service.update('uuid-cat-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('updates only provided fields', async () => {
      prismaMock.category.findUnique.mockResolvedValue(makeCategory());
      prismaMock.category.update.mockResolvedValue(makeCategory());

      await service.update('uuid-cat-1', { description: 'New description' });

      expect(prismaMock.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description: 'New description' }),
        }),
      );
    });

    it('throws NotFoundException when category does not exist', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes category when it exists', async () => {
      prismaMock.category.findUnique.mockResolvedValue(makeCategory());
      prismaMock.category.delete.mockResolvedValue(undefined);

      await expect(service.delete('uuid-cat-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when category does not exist', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
