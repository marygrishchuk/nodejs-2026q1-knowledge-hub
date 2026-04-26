import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { CommentService } from './comment.service';

const makeCommentRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-comment-1',
  content: 'Great article!',
  articleId: 'uuid-article-1',
  authorId: 'uuid-author-1',
  createdAt: new Date('2024-01-01'),
  author: { id: 'uuid-author-1', login: 'alice' },
  ...overrides,
});

describe('CommentService', () => {
  let service: CommentService;
  let prismaMock: {
    comment: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    article: {
      count: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      comment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      article: {
        count: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findByArticleId', () => {
    it('returns comments for an article', async () => {
      prismaMock.comment.findMany.mockResolvedValue([makeCommentRow()]);

      const result = await service.findByArticleId('uuid-article-1');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Great article!');
    });

    it('returns empty array when article has no comments', async () => {
      prismaMock.comment.findMany.mockResolvedValue([]);

      const result = await service.findByArticleId('uuid-article-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns comment when found', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(makeCommentRow());

      const result = await service.findById('uuid-comment-1');

      expect(result.id).toBe('uuid-comment-1');
    });

    it('throws NotFoundException when comment does not exist', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates comment when article exists', async () => {
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.comment.create.mockResolvedValue(makeCommentRow());

      const result = await service.create({
        content: 'Great article!',
        articleId: 'uuid-article-1',
        authorId: 'uuid-author-1',
      });

      expect(result.content).toBe('Great article!');
    });

    it('creates comment without authorId (anonymous)', async () => {
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.comment.create.mockResolvedValue(
        makeCommentRow({ authorId: null }),
      );

      await service.create({
        content: 'Anonymous comment',
        articleId: 'uuid-article-1',
      });

      expect(prismaMock.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: null }),
        }),
      );
    });

    it('throws UnprocessableEntityException when article does not exist', async () => {
      prismaMock.article.count.mockResolvedValue(0);

      await expect(
        service.create({
          content: 'Comment',
          articleId: 'nonexistent-article',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('delete', () => {
    it('deletes comment when it exists', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(makeCommentRow());
      prismaMock.comment.delete.mockResolvedValue(undefined);

      await expect(service.delete('uuid-comment-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when comment does not exist', async () => {
      prismaMock.comment.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
