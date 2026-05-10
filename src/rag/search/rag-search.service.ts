import { Injectable } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { RagSearchRequestDto } from '../dto/rag-search-request.dto';
import { RagSearchResponseDto, RagSearchResultDto } from '../dto/rag-search-response.dto';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { QdrantFilter, SearchResult } from '../vector-store/vector-store.types';

const SEMANTIC_WEIGHT = 0.7;
const LEXICAL_WEIGHT = 0.3;
const RERANK_BLEND = 0.8;
const DEFAULT_LIMIT = 5;
const CANDIDATE_MULTIPLIER = 2;

@Injectable()
export class RagSearchService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async search(dto: RagSearchRequestDto): Promise<RagSearchResponseDto> {
    const limit = dto.limit ?? DEFAULT_LIMIT;
    const candidateLimit = limit * CANDIDATE_MULTIPLIER;

    const queryVector = await this.embeddingService.embedText(dto.query);
    const filter = this.buildFilter(dto);

    const [semanticResults, lexicalResults] = await Promise.all([
      this.vectorStoreService.search(queryVector, candidateLimit, filter),
      this.vectorStoreService.scrollByQuery(dto.query, candidateLimit, filter),
    ]);

    const merged = this.mergeResults(semanticResults, lexicalResults);
    const reranked = this.rerank(merged, dto.query);

    const topResults = reranked.slice(0, limit);

    return {
      results: topResults.map((result) => ({
        articleId: result.payload.articleId,
        articleTitle: result.payload.articleTitle,
        chunk: result.payload.chunkText,
        similarity: result.score,
      })),
    };
  }

  private buildFilter(dto: RagSearchRequestDto): QdrantFilter | undefined {
    const conditions: QdrantFilter['must'] = [];

    if (dto.articleStatus) {
      conditions.push({ key: 'articleStatus', match: { value: dto.articleStatus } });
    }

    if (dto.categoryId) {
      conditions.push({ key: 'categoryId', match: { value: dto.categoryId } });
    }

    if (dto.tags && dto.tags.length > 0) {
      for (const tag of dto.tags) {
        conditions.push({ key: 'tags', match: { value: tag } });
      }
    }

    return conditions.length > 0 ? { must: conditions } : undefined;
  }

  private mergeResults(
    semanticResults: SearchResult[],
    lexicalResults: SearchResult[],
  ): ScoredResult[] {
    const scoreById: { [id: string]: ScoredResult } = {};

    for (const result of semanticResults) {
      scoreById[result.id] = {
        id: result.id,
        score: result.score * SEMANTIC_WEIGHT,
        payload: result.payload,
      };
    }

    for (const result of lexicalResults) {
      if (scoreById[result.id]) {
        scoreById[result.id].score += result.score * LEXICAL_WEIGHT;
      } else {
        scoreById[result.id] = {
          id: result.id,
          score: result.score * LEXICAL_WEIGHT,
          payload: result.payload,
        };
      }
    }

    return Object.values(scoreById).sort((a, b) => b.score - a.score);
  }

  private rerank(candidates: ScoredResult[], query: string): ScoredResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return candidates
      .map((candidate) => {
        const rerankScore = this.computeTermOverlap(
          candidate.payload.chunkText,
          queryTerms,
        );
        return {
          ...candidate,
          score: candidate.score * RERANK_BLEND + rerankScore * (1 - RERANK_BLEND),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private computeTermOverlap(chunkText: string, queryTerms: string[]): number {
    if (queryTerms.length === 0) {
      return 0;
    }
    const lowerChunk = chunkText.toLowerCase();
    const matchCount = queryTerms.filter((term) => lowerChunk.includes(term)).length;
    return matchCount / queryTerms.length;
  }
}

interface ScoredResult extends SearchResult {
  id: string;
}
