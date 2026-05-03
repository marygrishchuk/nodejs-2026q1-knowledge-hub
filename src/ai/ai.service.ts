import { Injectable } from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { AiCacheService } from './cache/ai-cache.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { GeminiService } from './gemini/gemini.service';
import {
  SummarizeArticleResponse,
  TranslateArticleResponse,
} from './interfaces/ai-responses.interface';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { AiUsageService } from './tracking/ai-usage.service';

@Injectable()
export class AiService {
  constructor(
    private readonly articleService: ArticleService,
    private readonly geminiService: GeminiService,
    private readonly cacheService: AiCacheService,
    private readonly usageService: AiUsageService,
  ) {}

  async summarizeArticle(
    articleId: string,
    dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponse> {
    const startTime = Date.now();
    this.usageService.trackRequest('summarize');

    const article = await this.articleService.findById(articleId);

    const cacheKey = this.cacheService.generateKey(
      articleId,
      'summarize',
      dto,
      new Date(article.updatedAt),
    );

    const cached = this.cacheService.get<SummarizeArticleResponse>(cacheKey);
    if (cached) {
      this.usageService.trackCacheHit();
      this.usageService.trackLatency('summarize', Date.now() - startTime);
      return cached;
    }

    this.usageService.trackCacheMiss();

    const prompt = buildSummarizePrompt(
      article.title,
      article.content,
      dto.maxLength,
    );

    const response = await this.geminiService.generateContent(prompt);
    const summary = this.geminiService.extractText(response);

    const usageMetadata = this.geminiService.getUsageMetadata(response);
    if (usageMetadata?.totalTokenCount) {
      this.usageService.trackTokens(usageMetadata.totalTokenCount);
    }

    const result: SummarizeArticleResponse = {
      articleId,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };

    this.cacheService.set(cacheKey, result);
    this.usageService.trackLatency('summarize', Date.now() - startTime);

    return result;
  }

  async translateArticle(
    articleId: string,
    dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponse> {
    const startTime = Date.now();
    this.usageService.trackRequest('translate');

    const article = await this.articleService.findById(articleId);

    const cacheKey = this.cacheService.generateKey(
      articleId,
      'translate',
      dto,
      new Date(article.updatedAt),
    );

    const cached = this.cacheService.get<TranslateArticleResponse>(cacheKey);
    if (cached) {
      this.usageService.trackCacheHit();
      this.usageService.trackLatency('translate', Date.now() - startTime);
      return cached;
    }

    this.usageService.trackCacheMiss();

    const prompt = buildTranslatePrompt(
      article.title,
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );

    const response = await this.geminiService.generateContent(prompt);
    const translatedText = this.geminiService.extractText(response);

    const usageMetadata = this.geminiService.getUsageMetadata(response);
    if (usageMetadata?.totalTokenCount) {
      this.usageService.trackTokens(usageMetadata.totalTokenCount);
    }

    const result: TranslateArticleResponse = {
      articleId,
      translatedText,
      detectedLanguage: dto.sourceLanguage || 'auto-detected',
    };

    this.cacheService.set(cacheKey, result);
    this.usageService.trackLatency('translate', Date.now() - startTime);

    return result;
  }
}

