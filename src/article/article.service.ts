import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommentService } from '../comment/comment.service';
import { ArticleStatus } from '../common/enums';
import { CreateArticleDto } from './dto/create-article.dto';
import { FilterArticleDto } from './dto/filter-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './interfaces/article.interface';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  findAll(filters: FilterArticleDto): Article[] {
    return this.articles.filter((article) => {
      if (filters.status && article.status !== filters.status) return false;
      if (filters.categoryId && article.categoryId !== filters.categoryId) return false;
      if (filters.tag && !article.tags.includes(filters.tag)) return false;
      return true;
    });
  }

  findById(id: string): Article {
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    return article;
  }

  exists(id: string): boolean {
    return this.articles.some((a) => a.id === id);
  }

  create(dto: CreateArticleDto): Article {
    const now = Date.now();
    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.articles.push(article);
    return article;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    const article = this.findById(id);
    if (dto.title !== undefined) article.title = dto.title;
    if (dto.content !== undefined) article.content = dto.content;
    if (dto.status !== undefined) article.status = dto.status;
    if (dto.authorId !== undefined) article.authorId = dto.authorId;
    if (dto.categoryId !== undefined) article.categoryId = dto.categoryId;
    if (dto.tags !== undefined) article.tags = dto.tags;
    article.updatedAt = Date.now();
    return article;
  }

  delete(id: string): void {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    this.commentService.deleteByArticleId(id);
    this.articles.splice(index, 1);
  }

  nullifyAuthor(userId: string): void {
    this.articles
      .filter((a) => a.authorId === userId)
      .forEach((a) => {
        a.authorId = null;
      });
  }

  nullifyCategory(categoryId: string): void {
    this.articles
      .filter((a) => a.categoryId === categoryId)
      .forEach((a) => {
        a.categoryId = null;
      });
  }

  findIdsByAuthor(userId: string): string[] {
    return this.articles.filter((a) => a.authorId === userId).map((a) => a.id);
  }

  deleteByIds(ids: string[]): void {
    this.articles = this.articles.filter((a) => !ids.includes(a.id));
  }
}
