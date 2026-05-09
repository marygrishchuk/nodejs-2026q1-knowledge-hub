import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class AiCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly ttlSeconds: number;

  constructor() {
    this.ttlSeconds = parseInt(process.env.AI_CACHE_TTL_SEC || '300', 10);
    this.startCleanupInterval();
  }

  generateKey(
    articleId: string,
    endpoint: string,
    params: Record<string, any>,
    updatedAt: Date,
  ): string {
    const dataToHash = `${articleId}:${endpoint}:${JSON.stringify(params)}:${updatedAt.toISOString()}`;
    return createHash('sha256').update(dataToHash).digest('hex');
  }

  set<T>(key: string, value: T): void {
    const expiresAt = Date.now() + this.ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }
}
