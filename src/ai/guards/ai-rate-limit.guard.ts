import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RateLimitEntry {
  timestamps: number[];
}

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly maxRequestsPerMinute: number;
  private readonly windowMs = 60000;

  constructor() {
    this.maxRequestsPerMinute = parseInt(
      process.env.AI_RATE_LIMIT_RPM || '20',
      10,
    );
    this.startCleanupInterval();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const clientIp = this.getClientIp(request);

    const now = Date.now();
    const entry = this.rateLimitMap.get(clientIp) || { timestamps: [] };

    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    if (entry.timestamps.length >= this.maxRequestsPerMinute) {
      const oldestTimestamp = entry.timestamps[0];
      const resetTime = oldestTimestamp + this.windowMs;
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);

      response.setHeader('Retry-After', retryAfterSeconds.toString());

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many AI requests. Please try again later.',
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.timestamps.push(now);
    this.rateLimitMap.set(clientIp, entry);

    return true;
  }

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips.trim();
    }
    return request.ip || 'unknown';
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [ip, entry] of this.rateLimitMap.entries()) {
        entry.timestamps = entry.timestamps.filter(
          (timestamp) => now - timestamp < this.windowMs,
        );
        if (entry.timestamps.length === 0) {
          this.rateLimitMap.delete(ip);
        }
      }
    }, 60000);
  }
}
