import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import {
  AnalyzeArticleResponse,
  SummarizeArticleResponse,
  TranslateArticleResponse,
} from './interfaces/ai-responses.interface';

@Controller('ai')
@UseGuards(AiRateLimitGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
}
