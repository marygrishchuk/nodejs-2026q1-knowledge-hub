import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../common/swagger/http-error.swagger.dto';
import {
  ApiBadRequestValidation,
  ApiJwtAuthErrors,
} from '../common/swagger/swagger-common.decorators';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { AiService } from './ai.service';
import {
  AnalyzeArticleResponseDto,
  DiagnosticsResponseDto,
  GenerateResponseDto,
  SummarizeArticleResponseDto,
  TranslateArticleResponseDto,
  UsageStatsResponseDto,
} from './dto/ai-response.swagger.dto';
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

@ApiTags('AI')
@ApiBearerAuth('Bearer')
@ApiExtraModels(HttpErrorResponseDto)
@Controller('ai')
@UseGuards(AiRateLimitGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly usageService: AiUsageService,
  ) {}

  @Post('articles/:articleId/summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summarize article via Gemini' })
  @ApiParam({ name: 'articleId', format: 'uuid', description: 'Article id' })
  @ApiResponse({
    status: 200,
    description: 'Summary generated',
    type: SummarizeArticleResponseDto,
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  @ApiResponse({
    status: 404,
    description: 'Article not found',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'AI rate limit exceeded',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Upstream/auth error from Gemini (generic client message)',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Gemini unavailable after retries',
    type: HttpErrorResponseDto,
  })
  async summarizeArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponse> {
    return this.aiService.summarizeArticle(articleId, dto);
  }

  @Post('articles/:articleId/translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Translate article content' })
  @ApiParam({ name: 'articleId', format: 'uuid', description: 'Article id' })
  @ApiResponse({
    status: 200,
    description: 'Translation generated',
    type: TranslateArticleResponseDto,
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  @ApiResponse({
    status: 404,
    description: 'Article not found',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'AI rate limit exceeded',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({ status: 500, type: HttpErrorResponseDto })
  @ApiResponse({
    status: 503,
    description: 'Gemini unavailable',
    type: HttpErrorResponseDto,
  })
  async translateArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponse> {
    return this.aiService.translateArticle(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze article (structured JSON from model)' })
  @ApiParam({ name: 'articleId', format: 'uuid', description: 'Article id' })
  @ApiResponse({
    status: 200,
    description: 'Analysis result',
    type: AnalyzeArticleResponseDto,
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  @ApiResponse({
    status: 404,
    description: 'Article not found',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'AI rate limit exceeded',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({ status: 500, type: HttpErrorResponseDto })
  @ApiResponse({
    status: 503,
    description: 'Gemini unavailable',
    type: HttpErrorResponseDto,
  })
  async analyzeArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponse> {
    return this.aiService.analyzeArticle(articleId, dto);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generic Gemini completion with optional session' })
  @ApiResponse({
    status: 200,
    description: 'Model reply',
    type: GenerateResponseDto,
  })
  @ApiJwtAuthErrors()
  @ApiBadRequestValidation()
  @ApiResponse({
    status: 429,
    description: 'AI rate limit exceeded',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({ status: 500, type: HttpErrorResponseDto })
  @ApiResponse({
    status: 503,
    description: 'Gemini unavailable',
    type: HttpErrorResponseDto,
  })
  async generate(@Body() dto: GenerateDto): Promise<GenerateResponse> {
    return this.aiService.generate(dto);
  }

  @Get('usage')
  @ApiOperation({ summary: 'AI usage counters since startup' })
  @ApiResponse({
    status: 200,
    description: 'Aggregated AI usage',
    type: UsageStatsResponseDto,
  })
  @ApiJwtAuthErrors()
  async getUsage(): Promise<UsageStats> {
    return this.usageService.getUsageStats();
  }

  @Get('diagnostics')
  @ApiOperation({ summary: 'Latency and cache diagnostics' })
  @ApiResponse({
    status: 200,
    description: 'Diagnostics snapshot',
    type: DiagnosticsResponseDto,
  })
  @ApiJwtAuthErrors()
  async getDiagnostics(): Promise<DiagnosticsResponse> {
    return this.usageService.getDiagnostics();
  }
}
