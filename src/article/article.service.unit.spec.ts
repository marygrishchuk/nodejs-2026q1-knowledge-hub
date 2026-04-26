import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleService } from './article.service';

const makePrismaArticle = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-article-1',
  title: 'Test Article',
  content: 'Test content',
  status: 'draft',
  authorId: 'uuid-author-1',
  categoryId: null,
  tags: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('ArticleService', () => {
  let service: ArticleService;
  let prismaMock: {
    article: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prismaMock = {
      article: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all articles when no filters applied', async () => {
      prismaMock.article.findMany.mockResolvedValue([makePrismaArticle()]);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Article');
    });

    it('filters by status', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.findAll({ status: ArticleStatus.PUBLISHED });

      expect(prismaMock.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('filters by categoryId', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.findAll({ categoryId: 'cat-uuid-1' });

      expect(prismaMock.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-uuid-1' }),
        }),
      );
    });

    it('filters by tag', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.findAll({ tag: 'nestjs' });

      expect(prismaMock.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { name: 'nestjs' } },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns article when found', async () => {
      prismaMock.article.findUnique.mockResolvedValue(makePrismaArticle());

      const result = await service.findById('uuid-article-1');

      expect(result.id).toBe('uuid-article-1');
    });

    it('throws NotFoundException when article does not exist', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exists', () => {
    it('returns true when article exists', async () => {
      prismaMock.article.count.mockResolvedValue(1);

      expect(await service.exists('uuid-article-1')).toBe(true);
    });

    it('returns false when article does not exist', async () => {
      prismaMock.article.count.mockResolvedValue(0);

      expect(await service.exists('nonexistent')).toBe(false);
    });
  });

  describe('create', () => {
    it('creates article with DRAFT status by default', async () => {
      prismaMock.article.create.mockResolvedValue(makePrismaArticle());

      await service.create({ title: 'Test', content: 'Body' });

      expect(prismaMock.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'draft' }),
        }),
      );
    });

    it('creates article with specified status', async () => {
      prismaMock.article.create.mockResolvedValue(
        makePrismaArticle({ status: 'published' }),
      );

      await service.create({
        title: 'Test',
        content: 'Body',
        status: ArticleStatus.PUBLISHED,
      });

      expect(prismaMock.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('creates article with tags using connectOrCreate', async () => {
      prismaMock.article.create.mockResolvedValue(
        makePrismaArticle({ tags: [{ name: 'typescript' }] }),
      );

      await service.create({
        title: 'Test',
        content: 'Body',
        tags: ['typescript'],
      });

      expect(prismaMock.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: {
              connectOrCreate: [
                { where: { name: 'typescript' }, create: { name: 'typescript' } },
              ],
            },
          }),
        }),
      );
    });

    it('creates article with empty tags array when no tags provided', async () => {
      prismaMock.article.create.mockResolvedValue(makePrismaArticle());

      await service.create({ title: 'Test', content: 'Body' });

      expect(prismaMock.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tags: { connectOrCreate: [] } }),
        }),
      );
    });
  });

  describe('update — status transitions', () => {
    it('allows transition from DRAFT to PUBLISHED', async () => {
      prismaMock.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: 'draft' }),
      );
      prismaMock.article.update.mockResolvedValue(
        makePrismaArticle({ status: 'published' }),
      );

      await expect(
        service.update('uuid-article-1', { status: ArticleStatus.PUBLISHED }),
      ).resolves.not.toThrow();
    });

    it('allows transition from PUBLISHED to ARCHIVED', async () => {
      prismaMock.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: 'published' }),
      );
      prismaMock.article.update.mockResolvedValue(
        makePrismaArticle({ status: 'archived' }),
      );

      await expect(
        service.update('uuid-article-1', { status: ArticleStatus.ARCHIVED }),
      ).resolves.not.toThrow();
    });

    it('allows transition from DRAFT to ARCHIVED', async () => {
      prismaMock.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: 'draft' }),
      );
      prismaMock.article.update.mockResolvedValue(
        makePrismaArticle({ status: 'archived' }),
      );

      await expect(
        service.update('uuid-article-1', { status: ArticleStatus.ARCHIVED }),
      ).resolves.not.toThrow();
    });

    it('throws BadRequestException when transitioning from ARCHIVED to any status', async () => {
      prismaMock.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: 'archived' }),
      );

      await expect(
        service.update('uuid-article-1', { status: ArticleStatus.PUBLISHED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when transitioning from PUBLISHED back to DRAFT', async () => {
      prismaMock.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: 'published' }),
      );

      await expect(
        service.update('uuid-article-1', { status: ArticleStatus.DRAFT }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows same-status update without throwing', async () => {
      prismaMock.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: 'draft' }),
      );
      prismaMock.article.update.mockResolvedValue(makePrismaArticle());

      await expect(
        service.update('uuid-article-1', { status: ArticleStatus.DRAFT }),
      ).resolves.not.toThrow();
    });
  });

  describe('update — tag management', () => {
    it('replaces tags when new tags array is provided', async () => {
      prismaMock.article.findUnique
        .mockResolvedValueOnce(makePrismaArticle({ status: 'draft' }))
        .mockResolvedValueOnce(
          makePrismaArticle({ tags: [{ name: 'new-tag' }] }),
        );
      prismaMock.$transaction.mockResolvedValue(undefined);

      await service.update('uuid-article-1', { tags: ['new-tag'] });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('update — non-existent article', () => {
    it('throws NotFoundException for non-existent article', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes article when it exists', async () => {
      prismaMock.article.findUnique.mockResolvedValue(makePrismaArticle());
      prismaMock.article.delete.mockResolvedValue(undefined);

      await expect(service.delete('uuid-article-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when article does not exist', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
