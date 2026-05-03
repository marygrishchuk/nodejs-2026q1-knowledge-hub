import { Injectable } from '@nestjs/common';
import { DiagnosticsResponse, UsageStats } from '../interfaces/ai-responses.interface';

interface LatencyRecord {
  timestamp: number;
  latencyMs: number;
  endpoint: string;
}

@Injectable()
export class AiUsageService {
  private totalRequests = 0;
  private endpointCounters = {
    summarize: 0,
    translate: 0,
    analyze: 0,
    generate: 0,
  };
  private totalTokens = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private latencyRecords: LatencyRecord[] = [];
  private startTime = Date.now();

  trackRequest(endpoint: 'summarize' | 'translate' | 'analyze' | 'generate'): void {
    this.totalRequests++;
    this.endpointCounters[endpoint]++;
  }

  trackTokens(tokenCount: number): void {
    this.totalTokens += tokenCount;
  }

  trackCacheHit(): void {
    this.cacheHits++;
  }

  trackCacheMiss(): void {
    this.cacheMisses++;
  }

  trackLatency(endpoint: string, latencyMs: number): void {
    this.latencyRecords.push({
      timestamp: Date.now(),
      latencyMs,
      endpoint,
    });

    const oneHourAgo = Date.now() - 3600000;
    this.latencyRecords = this.latencyRecords.filter(
      (record) => record.timestamp > oneHourAgo,
    );
  }

  getUsageStats(): UsageStats {
    return {
      totalRequests: this.totalRequests,
      byEndpoint: { ...this.endpointCounters },
      totalTokens: this.totalTokens > 0 ? this.totalTokens : undefined,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }

  getDiagnostics(): DiagnosticsResponse {
    const latencies = this.latencyRecords.map((r) => r.latencyMs);
    const sortedLatencies = [...latencies].sort((a, b) => a - b);

    const p50Index = Math.floor(sortedLatencies.length * 0.5);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);

    const p50 = sortedLatencies[p50Index] || 0;
    const p95 = sortedLatencies[p95Index] || 0;
    const average =
      latencies.length > 0
        ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
        : 0;

    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRatio =
      totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;

    return {
      uptime: Date.now() - this.startTime,
      usage: this.getUsageStats(),
      latency: {
        p50: Math.round(p50),
        p95: Math.round(p95),
        average: Math.round(average),
      },
      cacheHitRatio: Math.round(cacheHitRatio * 100) / 100,
    };
  }
}
