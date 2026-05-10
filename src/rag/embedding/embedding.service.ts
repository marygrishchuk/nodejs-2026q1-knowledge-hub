import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EmbedContentResponse } from './embedding.types';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxRetries = 3;
  private readonly initialRetryDelayMs = 100;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.baseUrl =
      process.env.GEMINI_API_BASE_URL ??
      'https://generativelanguage.googleapis.com';
    this.model =
      process.env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-004';

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
  }

  async embedText(text: string): Promise<number[]> {
    return this.callWithRetry(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embedText(text));
    }
    return results;
  }

  private async callWithRetry(text: string, attempt = 0): Promise<number[]> {
    try {
      const url = `${this.baseUrl}/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as EmbedContentResponse;
        return data.embedding.values;
      }

      const statusCode = response.status;

      if (statusCode === 429 || statusCode >= 500) {
        if (attempt < this.maxRetries) {
          const delay = this.initialRetryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
          return this.callWithRetry(text, attempt + 1);
        }
        this.logger.error(
          `Gemini Embeddings API unavailable after ${this.maxRetries} retries (status ${statusCode})`,
        );
        throw new ServiceUnavailableException(
          'Embedding service is temporarily unavailable',
        );
      }

      if (statusCode === 401 || statusCode === 403) {
        throw new InternalServerErrorException(
          'Embedding service authentication failed',
        );
      }

      throw new InternalServerErrorException(
        `Embedding API error: ${statusCode}`,
      );
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      if (attempt < this.maxRetries) {
        const delay = this.initialRetryDelayMs * Math.pow(2, attempt);
        await this.sleep(delay);
        return this.callWithRetry(text, attempt + 1);
      }

      this.logger.error('Failed to connect to Gemini Embeddings API');
      throw new ServiceUnavailableException(
        'Failed to connect to embedding service',
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
