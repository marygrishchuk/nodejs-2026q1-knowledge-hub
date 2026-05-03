import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GeminiRequest, GeminiResponse } from './gemini.types';

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxRetries = 3;
  private readonly initialRetryDelayMs = 100;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl =
      process.env.GEMINI_API_BASE_URL ||
      'https://generativelanguage.googleapis.com';
    this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
  }

  async generateContent(
    prompt: string,
    options?: { jsonMode?: boolean },
  ): Promise<GeminiResponse> {
    const request: GeminiRequest = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: options?.jsonMode
        ? { responseMimeType: 'application/json' }
        : undefined,
    };

    return this.callWithRetry(request);
  }

  private async callWithRetry(
    request: GeminiRequest,
    attempt = 0,
  ): Promise<GeminiResponse> {
    try {
      const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        return data as GeminiResponse;
      }

      const statusCode = response.status;

      if (statusCode === 429 || statusCode >= 500) {
        if (attempt < this.maxRetries) {
          const delay = this.initialRetryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
          return this.callWithRetry(request, attempt + 1);
        }
        throw new ServiceUnavailableException(
          'Gemini API is temporarily unavailable',
        );
      }

      if (statusCode === 401 || statusCode === 403) {
        throw new InternalServerErrorException(
          'AI service authentication failed',
        );
      }

      const errorText = await response.text();
      throw new InternalServerErrorException(
        `Gemini API error: ${statusCode}`,
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
        return this.callWithRetry(request, attempt + 1);
      }

      throw new ServiceUnavailableException(
        'Failed to connect to AI service',
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  extractText(response: GeminiResponse): string {
    if (
      !response.candidates ||
      response.candidates.length === 0 ||
      !response.candidates[0].content.parts ||
      response.candidates[0].content.parts.length === 0
    ) {
      throw new InternalServerErrorException('Invalid AI response format');
    }
    return response.candidates[0].content.parts[0].text;
  }

  getUsageMetadata(response: GeminiResponse) {
    return response.usageMetadata;
  }
}
