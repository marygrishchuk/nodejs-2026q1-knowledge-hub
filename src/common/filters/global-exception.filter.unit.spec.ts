import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/custom-errors';
import { GlobalExceptionFilter } from './global-exception.filter';

const makeHost = (jsonFn = vi.fn()) => {
  const response = { status: vi.fn().mockReturnThis(), json: jsonFn };
  return {
    switchToHttp: () => ({ getResponse: () => response }),
    response,
  } as unknown as ArgumentsHost & { response: typeof response };
};

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('returns 404 and correct shape for NotFoundError', () => {
    const host = makeHost();
    filter.catch(new NotFoundError('Resource missing'), host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(404);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: 'Resource missing',
      }),
    );
  });

  it('returns 400 and correct shape for ValidationError', () => {
    const host = makeHost();
    filter.catch(new ValidationError('Invalid input'), host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(400);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, error: 'Bad Request' }),
    );
  });

  it('returns 401 and correct shape for UnauthorizedError', () => {
    const host = makeHost();
    filter.catch(new UnauthorizedError('Token expired'), host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(401);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, error: 'Unauthorized' }),
    );
  });

  it('returns 403 and correct shape for ForbiddenError', () => {
    const host = makeHost();
    filter.catch(new ForbiddenError('Access denied'), host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(403);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, error: 'Forbidden' }),
    );
  });

  it('returns 500 with safe message for unknown errors', () => {
    const host = makeHost();
    filter.catch(new Error('database exploded'), host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(500);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'An unexpected error occurred',
      }),
    );
  });

  it('returns status from NestJS HttpException', () => {
    const host = makeHost();
    filter.catch(
      new NotFoundException('Article not found'),
      host as ArgumentsHost,
    );

    expect(host.response.status).toHaveBeenCalledWith(404);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Article not found' }),
    );
  });

  it('returns 400 for BadRequestException with message string', () => {
    const host = makeHost();
    filter.catch(
      new BadRequestException('Missing field'),
      host as ArgumentsHost,
    );

    expect(host.response.status).toHaveBeenCalledWith(400);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Missing field' }),
    );
  });

  it('returns 401 for NestJS UnauthorizedException', () => {
    const host = makeHost();
    filter.catch(new UnauthorizedException(), host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 for NestJS ForbiddenException', () => {
    const host = makeHost();
    filter.catch(new ForbiddenException(), host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(403);
  });

  it('handles HttpException with array message', () => {
    const host = makeHost();
    filter.catch(
      new HttpException(
        { message: ['field must be string', 'field required'] },
        HttpStatus.BAD_REQUEST,
      ),
      host as ArgumentsHost,
    );

    const jsonArg = (host.response.json as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(jsonArg.message).toContain('field must be string');
  });

  it('returns 500 for non-Error thrown values', () => {
    const host = makeHost();
    filter.catch('some string error', host as ArgumentsHost);

    expect(host.response.status).toHaveBeenCalledWith(500);
  });
});
