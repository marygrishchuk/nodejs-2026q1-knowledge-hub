export interface SummarizeArticleResponse {
  articleId: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
}

export interface TranslateArticleResponse {
  articleId: string;
  translatedText: string;
  detectedLanguage: string;
}

export interface AnalyzeArticleResponse {
  articleId: string;
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface GenerateResponse {
  response: string;
  sessionId?: string;
}

export interface UsageStats {
  totalRequests: number;
  byEndpoint: {
    summarize: number;
    translate: number;
    analyze: number;
    generate: number;
  };
  totalTokens?: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface DiagnosticsResponse {
  uptime: number;
  usage: UsageStats;
  latency: {
    p50: number;
    p95: number;
    average: number;
  };
  cacheHitRatio: number;
}
