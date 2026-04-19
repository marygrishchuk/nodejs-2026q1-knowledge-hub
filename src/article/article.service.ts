import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ArticleStatus } from '../common/enums';
import { apiArticleStatusToPrisma } from '../prisma/prisma-enums';
import { mapArticle } from '../prisma/prisma-mappers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { FilterArticleDto } from './dto/filter-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './interfaces/article.interface';

const articleInclude = { tags: true as const };

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterArticleDto): Promise<Article[]> {
    const where = this.buildArticleWhere(filters);
    const rows = await this.prisma.article.findMany({
      where,
      include: articleInclude,
    });
    return rows.map(mapArticle);
  }

  async findById(id: string): Promise<Article> {
    const row = await this.prisma.article.findUnique({
      where: { id },
      include: articleInclude,
    });
    if (!row) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    return mapArticle(row);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.article.count({ where: { id } });
    return count > 0;
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    const tagNames = dto.tags ?? [];
    const row = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: apiArticleStatusToPrisma(dto.status ?? ArticleStatus.DRAFT),
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: {
          connectOrCreate: tagNames.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: articleInclude,
    });
    return mapArticle(row);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    await this.findById(id);

    if (dto.tags) {
      const data: Prisma.ArticleUncheckedUpdateInput = {};
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.content !== undefined) data.content = dto.content;
      if (dto.status !== undefined) {
        data.status = apiArticleStatusToPrisma(dto.status);
      }
      if (dto.authorId) data.authorId = dto.authorId;
      if (dto.categoryId) data.categoryId = dto.categoryId;

      await this.prisma.$transaction([
        this.prisma.article.update({
          where: { id },
          data: { tags: { set: [] } },
        }),
        this.prisma.article.update({
          where: { id },
          data: {
            ...data,
            tags: {
              connectOrCreate: dto.tags.map((name) => ({
                where: { name },
                create: { name },
              })),
            },
          },
        }),
      ]);
      return this.findById(id);
    }

    const data: Prisma.ArticleUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.status !== undefined) {
      data.status = apiArticleStatusToPrisma(dto.status);
    }
    if (dto.authorId) data.authorId = dto.authorId;
    if (dto.categoryId) data.categoryId = dto.categoryId;

    const row = await this.prisma.article.update({
      where: { id },
      data,
      include: articleInclude,
    });
    return mapArticle(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    await this.prisma.article.delete({ where: { id } });
  }

  private buildArticleWhere(
    filters: FilterArticleDto,
  ): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};
    if (filters.status) {
      where.status = apiArticleStatusToPrisma(filters.status);
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.tag) {
      where.tags = { some: { name: filters.tag } };
    }
    return where;
  }
}
