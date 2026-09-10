import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** OpenAPI response schemas aligned with AI route JSON bodies. */

export class SummarizeArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ description: 'Character length of original article body' })
  originalLength: number;

  @ApiProperty({ description: 'Character length of generated summary' })
  summaryLength: number;
}

export class TranslateArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  translatedText: string;

  @ApiProperty({
    description: 'Source language hint or label returned with the result',
  })
  detectedLanguage: string;
}

export class AnalyzeArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  analysis: string;

  @ApiProperty({ type: [String] })
  suggestions: string[];

  @ApiProperty({ enum: ['info', 'warning', 'error'] })
  severity: 'info' | 'warning' | 'error';
}

export class GenerateResponseDto {
  @ApiProperty()
  response: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Session id for follow-up prompts',
  })
  sessionId?: string;
}

export class AiUsageByEndpointDto {
  @ApiProperty()
  summarize: number;

  @ApiProperty()
  translate: number;

  @ApiProperty()
  analyze: number;

  @ApiProperty()
  generate: number;
}

export class UsageStatsResponseDto {
  @ApiProperty()
  totalRequests: number;

  @ApiProperty({ type: AiUsageByEndpointDto })
  byEndpoint: AiUsageByEndpointDto;

  @ApiPropertyOptional({
    description: 'Total tokens if reported by Gemini',
  })
  totalTokens?: number;

  @ApiProperty()
  cacheHits: number;

  @ApiProperty()
  cacheMisses: number;
}

export class AiLatencyResponseDto {
  @ApiProperty({ description: 'Median latency in ms (recent window)' })
  p50: number;

  @ApiProperty({ description: '95th percentile latency in ms' })
  p95: number;

  @ApiProperty()
  average: number;
}

export class DiagnosticsResponseDto {
  @ApiProperty({ description: 'Process uptime in ms since startup' })
  uptime: number;

  @ApiProperty({ type: UsageStatsResponseDto })
  usage: UsageStatsResponseDto;

  @ApiProperty({ type: AiLatencyResponseDto })
  latency: AiLatencyResponseDto;

  @ApiProperty({
    description: 'Ratio of cache hits to total cache lookups (0–1)',
  })
  cacheHitRatio: number;
}
