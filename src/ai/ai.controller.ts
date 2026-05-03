import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import {
  AnalyzeArticleResponse,
  DiagnosticsResponse,
  GenerateResponse,
  SummarizeArticleResponse,
  TranslateArticleResponse,
  UsageStats,
} from './interfaces/ai-responses.interface';
import { AiUsageService } from './tracking/ai-usage.service';

@Controller('ai')
@UseGuards(AiRateLimitGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly usageService: AiUsageService,
  ) {}

  @Post('articles/:articleId/summarize')
  async summarizeArticle(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponse> {
    return this.aiService.summarizeArticle(articleId, dto);
  }

  @Post('articles/:articleId/translate')
  async translateArticle(
    @Param('articleId') articleId: string,
    @Body() dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponse> {
    return this.aiService.translateArticle(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  async analyzeArticle(
    @Param('articleId') articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponse> {
    return this.aiService.analyzeArticle(articleId, dto);
  }

  @Post('generate')
  async generate(@Body() dto: GenerateDto): Promise<GenerateResponse> {
    return this.aiService.generate(dto);
  }

  @Get('usage')
  async getUsage(): Promise<UsageStats> {
    return this.usageService.getUsageStats();
  }

  @Get('diagnostics')
  async getDiagnostics(): Promise<DiagnosticsResponse> {
    return this.usageService.getDiagnostics();
  }
}
