import { Injectable } from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { AiCacheService } from './cache/ai-cache.service';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { GeminiService } from './gemini/gemini.service';
import {
  AnalyzeArticleResponse,
  GenerateResponse,
  SummarizeArticleResponse,
  TranslateArticleResponse,
} from './interfaces/ai-responses.interface';
import { buildAnalyzePrompt } from './prompts/analyze.prompt';
import { buildGeneratePrompt } from './prompts/generate.prompt';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { AiSessionService } from './session/ai-session.service';
import { AiUsageService } from './tracking/ai-usage.service';
import { AiOutputValidator } from './validators/ai-output.validator';

@Injectable()
export class AiService {
  constructor(
    private readonly articleService: ArticleService,
    private readonly geminiService: GeminiService,
    private readonly cacheService: AiCacheService,
    private readonly usageService: AiUsageService,
    private readonly outputValidator: AiOutputValidator,
    private readonly sessionService: AiSessionService,
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

  async analyzeArticle(
    articleId: string,
    dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponse> {
    const startTime = Date.now();
    this.usageService.trackRequest('analyze');

    const article = await this.articleService.findById(articleId);

    const prompt = buildAnalyzePrompt(article.title, article.content, dto.task);

    const response = await this.geminiService.generateContent(prompt, {
      jsonMode: true,
    });
    const jsonText = this.geminiService.extractText(response);

    const usageMetadata = this.geminiService.getUsageMetadata(response);
    if (usageMetadata?.totalTokenCount) {
      this.usageService.trackTokens(usageMetadata.totalTokenCount);
    }

    const validated = this.outputValidator.validateAnalyzeOutput(jsonText);

    const result: AnalyzeArticleResponse = {
      articleId,
      analysis: validated.analysis,
      suggestions: validated.suggestions,
      severity: validated.severity,
    };

    this.usageService.trackLatency('analyze', Date.now() - startTime);

    return result;
  }

  async generate(dto: GenerateDto): Promise<GenerateResponse> {
    const startTime = Date.now();
    this.usageService.trackRequest('generate');

    let sessionId = dto.sessionId;
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (sessionId) {
      if (!this.sessionService.sessionExists(sessionId)) {
        sessionId = this.sessionService.createSession();
      }
      history = this.sessionService.getHistory(sessionId);
    } else {
      sessionId = this.sessionService.createSession();
    }

    this.sessionService.addMessage(sessionId, 'user', dto.prompt);

    const prompt = buildGeneratePrompt(dto.prompt, history);

    const response = await this.geminiService.generateContent(prompt);
    const generatedText = this.geminiService.extractText(response);

    const usageMetadata = this.geminiService.getUsageMetadata(response);
    if (usageMetadata?.totalTokenCount) {
      this.usageService.trackTokens(usageMetadata.totalTokenCount);
    }

    this.sessionService.addMessage(sessionId, 'assistant', generatedText);

    this.usageService.trackLatency('generate', Date.now() - startTime);

    return {
      response: generatedText,
      sessionId,
    };
  }
}
