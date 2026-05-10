import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ArticleService } from '../../article/article.service';
import { FilterArticleDto } from '../../article/dto/filter-article.dto';
import { ArticleStatus } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { ChunkerService } from '../chunker/chunker.service';
import { ReindexRequestDto } from '../dto/reindex-request.dto';
import { ReindexResponseDto } from '../dto/reindex-response.dto';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { VectorPoint } from '../vector-store/vector-store.types';

@Injectable()
export class IndexerService {
  private readonly collection =
    process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';

  constructor(
    private readonly articleService: ArticleService,
    private readonly chunkerService: ChunkerService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly prisma: PrismaService,
  ) {}

  async indexArticles(dto: ReindexRequestDto): Promise<ReindexResponseDto> {
    const onlyPublished = dto.onlyPublished ?? true;

    const filter: FilterArticleDto = {
      ...(onlyPublished ? { status: ArticleStatus.PUBLISHED } : {}),
    };

    const allArticles = await this.articleService.findAll(filter);

    const articles =
      dto.articleIds && dto.articleIds.length > 0
        ? allArticles.filter((article) => dto.articleIds!.includes(article.id))
        : allArticles;

    // Load all existing index records for the selected articles in one query
    const articleIds = articles.map((a) => a.id);
    const existingRecords = await this.prisma.ragIndexRecord.findMany({
      where: { articleId: { in: articleIds } },
    });
    const indexedAtMap: Record<string, Date> = {};
    for (const record of existingRecords) {
      indexedAtMap[record.articleId] = record.indexedAt;
    }

    let totalChunks = 0;

    for (const article of articles) {
      const lastIndexedAt = indexedAtMap[article.id];
      const articleUpdatedAt = new Date(article.updatedAt);

      if (lastIndexedAt && lastIndexedAt >= articleUpdatedAt) {
        // Article unchanged since last index — count chunks without re-embedding
        const chunks = this.chunkerService.chunkText(article.content);
        totalChunks += chunks.length;
        continue;
      }

      // Delete stale vectors then re-embed
      await this.vectorStoreService.deleteByArticleId(article.id);

      const chunks = this.chunkerService.chunkText(article.content);
      const embeddings = await this.embeddingService.embedBatch(chunks);

      const points: VectorPoint[] = chunks.map((chunk, index) => ({
        id: randomUUID(),
        vector: embeddings[index],
        payload: {
          articleId: article.id,
          articleTitle: article.title,
          articleStatus: article.status,
          categoryId: article.categoryId,
          tags: article.tags,
          chunkText: chunk,
        },
      }));

      await this.vectorStoreService.upsertPoints(points);

      // Persist the index timestamp so it survives restarts
      await this.prisma.ragIndexRecord.upsert({
        where: { articleId: article.id },
        create: { articleId: article.id, indexedAt: articleUpdatedAt },
        update: { indexedAt: articleUpdatedAt },
      });

      totalChunks += chunks.length;
    }

    return {
      indexedArticles: articles.length,
      indexedChunks: totalChunks,
      vectorCollection: this.collection,
    };
  }

  async deleteArticleVectors(
    articleId: string,
  ): Promise<{ articleId: string; deletedCount: number }> {
    const deletedCount =
      await this.vectorStoreService.deleteByArticleId(articleId);

    if (deletedCount === 0) {
      throw new NotFoundException(
        `No vector entries found for article ${articleId}`,
      );
    }

    // Remove the persisted index record so the article is treated as
    // unindexed on the next reindex run
    await this.prisma.ragIndexRecord.deleteMany({
      where: { articleId },
    });

    return { articleId, deletedCount };
  }
}
