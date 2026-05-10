import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ArticleService } from '../../article/article.service';
import { FilterArticleDto } from '../../article/dto/filter-article.dto';
import { ArticleStatus } from '../../common/enums';
import { ChunkerService } from '../chunker/chunker.service';
import { ReindexRequestDto } from '../dto/reindex-request.dto';
import { ReindexResponseDto } from '../dto/reindex-response.dto';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { VectorPoint } from '../vector-store/vector-store.types';

@Injectable()
export class IndexerService {
  private readonly indexedAt: { [articleId: string]: number } = {};
  private readonly collection =
    process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';

  constructor(
    private readonly articleService: ArticleService,
    private readonly chunkerService: ChunkerService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async indexArticles(dto: ReindexRequestDto): Promise<ReindexResponseDto> {
    const onlyPublished = dto.onlyPublished ?? true;

    const filter: FilterArticleDto = {
      ...(onlyPublished ? { status: ArticleStatus.PUBLISHED } : {}),
    };

    const allArticles = await this.articleService.findAll(filter);

    const articles =
      dto.articleIds && dto.articleIds.length > 0
        ? allArticles.filter((article) =>
            dto.articleIds!.includes(article.id),
          )
        : allArticles;

    let totalChunks = 0;

    for (const article of articles) {
      const lastIndexedAt = this.indexedAt[article.id];
      if (lastIndexedAt && lastIndexedAt >= article.updatedAt) {
        const chunks = this.chunkerService.chunkText(article.content);
        totalChunks += chunks.length;
        continue;
      }

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
      this.indexedAt[article.id] = article.updatedAt;
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

    delete this.indexedAt[articleId];

    return { articleId, deletedCount };
  }
}
