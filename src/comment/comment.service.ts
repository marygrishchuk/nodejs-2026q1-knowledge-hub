import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ArticleService } from '../article/article.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './interfaces/comment.interface';

@Injectable()
export class CommentService {
  private comments: Comment[] = [];

  constructor(private readonly articleService: ArticleService) {}

  findByArticleId(articleId: string): Comment[] {
    return this.comments.filter((c) => c.articleId === articleId);
  }

  findById(id: string): Comment {
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return comment;
  }

  create(dto: CreateCommentDto): Comment {
    if (!this.articleService.exists(dto.articleId)) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} not found`,
      );
    }
    const comment: Comment = {
      id: randomUUID(),
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
      createdAt: Date.now(),
    };
    this.comments.push(comment);
    return comment;
  }

  delete(id: string): void {
    const index = this.comments.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    this.comments.splice(index, 1);
  }

  deleteByArticleId(articleId: string): void {
    this.comments = this.comments.filter((c) => c.articleId !== articleId);
  }

  deleteByAuthorId(authorId: string): void {
    this.comments = this.comments.filter((c) => c.authorId !== authorId);
  }
}
