import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { HttpErrorResponseDto } from './http-error.swagger.dto';

/** Standard JSON errors when JWT access guard or RBAC denies access. */
export function ApiJwtAuthErrors(options?: { notFound?: boolean }) {
  const decorators = [
    ApiResponse({
      status: 401,
      description:
        'Unauthorized — missing `Authorization: Bearer`, invalid token, or expired access token',
      type: HttpErrorResponseDto,
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden — insufficient role or not allowed to modify this resource',
      type: HttpErrorResponseDto,
    }),
  ];
  if (options?.notFound) {
    decorators.push(
      ApiResponse({
        status: 404,
        description: 'Resource not found',
        type: HttpErrorResponseDto,
      }),
    );
  }
  return applyDecorators(...decorators);
}

export function ApiBadRequestValidation() {
  return ApiResponse({
    status: 400,
    description: 'Bad request — validation failed (`class-validator`)',
    type: HttpErrorResponseDto,
  });
}

export function ApiTooManyRequests() {
  return ApiResponse({
    status: 429,
    description: 'Too many requests — auth endpoint rate limit',
    type: HttpErrorResponseDto,
  });
}
