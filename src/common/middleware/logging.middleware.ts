import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger';

const SENSITIVE_FIELD_NAMES = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
]);

const sanitizeBody = (body: unknown): unknown => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }
  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([key, value]) => [
      key,
      SENSITIVE_FIELD_NAMES.has(key.toLowerCase()) ? '[REDACTED]' : value,
    ]),
  );
};

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new AppLogger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, query, body } = request;

    this.logger.log(
      `Incoming ${method} ${originalUrl} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(sanitizeBody(body))}`,
    );

    response.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.log(
        `Outgoing ${method} ${originalUrl} | status: ${response.statusCode} | ${duration}ms`,
      );
    });

    next();
  }
}
