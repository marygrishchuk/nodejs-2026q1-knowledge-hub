import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapComment } from '../prisma/prisma-mappers';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './interfaces/comment.interface';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findByArticleId(articleId: string): Promise<Comment[]> {
    const rows = await this.prisma.comment.findMany({ where: { articleId } });
    return rows.map(mapComment);
  }

  async findById(id: string): Promise<Comment> {
    const row = await this.prisma.comment.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return mapComment(row);
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    const articleCount = await this.prisma.article.count({
      where: { id: dto.articleId },
    });
    if (articleCount === 0) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} not found`,
      );
    }
    const row = await this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId ?? null,
      },
    });
    return mapComment(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    await this.prisma.comment.delete({ where: { id } });
  }
}
