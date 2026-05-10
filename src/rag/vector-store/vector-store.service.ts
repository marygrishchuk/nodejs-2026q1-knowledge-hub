import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  QdrantCountResponse,
  QdrantDeleteResponse,
  QdrantFilter,
  QdrantScrollResponse,
  QdrantSearchResponse,
  SearchResult,
  VectorPoint,
} from './vector-store.types';

const VECTOR_DIMENSION = 768;

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly baseUrl: string;
  private readonly collection: string;

  constructor() {
    this.baseUrl =
      process.env.RAG_VECTOR_DB_URL ?? 'http://vectordb:6333';
    this.collection =
      process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';
  }

  async onModuleInit(): Promise<void> {
    await this.ensureCollection();
  }

  async upsertPoints(points: VectorPoint[]): Promise<void> {
    const body = {
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload,
      })),
    };

    await this.request(
      'PUT',
      `/collections/${this.collection}/points?wait=true`,
      body,
    );
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    const countBefore = await this.countByArticleId(articleId);

    if (countBefore === 0) {
      return 0;
    }

    const body = {
      filter: {
        must: [{ key: 'articleId', match: { value: articleId } }],
      },
    };

    await this.request<QdrantDeleteResponse>(
      'POST',
      `/collections/${this.collection}/points/delete?wait=true`,
      body,
    );

    return countBefore;
  }

  async search(
    vector: number[],
    limit: number,
    filter?: QdrantFilter,
  ): Promise<SearchResult[]> {
    const body = {
      vector,
      limit,
      with_payload: true,
      ...(filter ? { filter } : {}),
    };

    const response = await this.request<QdrantSearchResponse>(
      'POST',
      `/collections/${this.collection}/points/search`,
      body,
    );

    return response.result.map((point) => ({
      id: String(point.id),
      score: point.score ?? 0,
      payload: point.payload,
    }));
  }

  async scrollByQuery(
    query: string,
    limit: number,
    filter?: QdrantFilter,
  ): Promise<SearchResult[]> {
    const body = {
      limit: limit * 10,
      with_payload: true,
      ...(filter ? { filter } : {}),
    };

    const response = await this.request<QdrantScrollResponse>(
      'POST',
      `/collections/${this.collection}/points/scroll`,
      body,
    );

    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return response.result.points
      .filter((point) => {
        const chunkText = point.payload.chunkText.toLowerCase();
        return queryTerms.some((term) => chunkText.includes(term));
      })
      .slice(0, limit)
      .map((point) => ({
        id: String(point.id),
        score: this.computeLexicalScore(point.payload.chunkText, queryTerms),
        payload: point.payload,
      }));
  }

  private computeLexicalScore(chunkText: string, queryTerms: string[]): number {
    const lowerChunk = chunkText.toLowerCase();
    const matchCount = queryTerms.filter((term) =>
      lowerChunk.includes(term),
    ).length;
    return matchCount / queryTerms.length;
  }

  private async countByArticleId(articleId: string): Promise<number> {
    const body = {
      filter: {
        must: [{ key: 'articleId', match: { value: articleId } }],
      },
    };

    const response = await this.request<QdrantCountResponse>(
      'POST',
      `/collections/${this.collection}/points/count`,
      body,
    );

    return response.result.count;
  }

  private async ensureCollection(): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${this.collection}`,
      );

      if (response.status === 404) {
        await this.createCollection();
        this.logger.log(`Created Qdrant collection: ${this.collection}`);
      } else if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error('Failed to ensure Qdrant collection exists');
      throw new ServiceUnavailableException(
        'Vector database is unavailable',
      );
    }
  }

  private async createCollection(): Promise<void> {
    const body = {
      vectors: {
        size: VECTOR_DIMENSION,
        distance: 'Cosine',
      },
    };

    await this.request(
      'PUT',
      `/collections/${this.collection}`,
      body,
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logger.error(
          `Qdrant request failed: ${method} ${path} → ${response.status} ${errorText}`,
        );
        throw new ServiceUnavailableException(
          'Vector database is unavailable',
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Qdrant connection error: ${method} ${path}`);
      throw new ServiceUnavailableException(
        'Vector database is unavailable',
      );
    }
  }
}
