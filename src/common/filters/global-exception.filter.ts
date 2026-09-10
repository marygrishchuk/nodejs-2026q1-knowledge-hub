import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppLogger } from '../logger/app-logger';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/custom-errors';

const logger = new AppLogger('ExceptionFilter');

const resolveStatusCode = (exception: unknown): number => {
  if (
    exception instanceof NotFoundError ||
    exception instanceof ValidationError ||
    exception instanceof UnauthorizedError ||
    exception instanceof ForbiddenError
  ) {
    return exception.statusCode;
  }
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
};

const resolveErrorLabel = (statusCode: number): string => {
  const labels: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return labels[statusCode] ?? 'Error';
};

const resolveMessage = (exception: unknown, statusCode: number): string => {
  if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
    return 'An unexpected error occurred';
  }
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      const msg = responseObj.message;
      if (Array.isArray(msg)) {
        return msg.join(', ');
      }
      if (typeof msg === 'string') {
        return msg;
      }
    }
  }
  if (exception instanceof Error) {
    return exception.message;
  }
  return resolveErrorLabel(statusCode);
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const statusCode = resolveStatusCode(exception);

    if (statusCode >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      logger.error(`Unhandled exception: ${stack}`);
    }

    response.status(statusCode).json({
      statusCode,
      error: resolveErrorLabel(statusCode),
      message: resolveMessage(exception, statusCode),
    });
  }
}
