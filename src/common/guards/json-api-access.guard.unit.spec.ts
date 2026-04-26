import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonApiAccessGuard } from './json-api-access.guard';

const makeContext = (
  options: {
    method?: string;
    path?: string;
    accept?: string;
  } = {},
) => {
  const { method = 'GET', path = '/article', accept = 'application/json' } = options;
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        path,
        url: path,
        headers: { accept },
      }),
    }),
  } as unknown as ExecutionContext;
};

describe('JsonApiAccessGuard', () => {
  let guard: JsonApiAccessGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonApiAccessGuard],
    }).compile();

    guard = module.get<JsonApiAccessGuard>(JsonApiAccessGuard);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows OPTIONS requests without checking Accept header', () => {
    const context = makeContext({ method: 'OPTIONS', accept: '' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests with Accept: application/json', () => {
    const context = makeContext({ accept: 'application/json' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests with Accept: */*', () => {
    const context = makeContext({ accept: '*/*' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests with Accept: application/*', () => {
    const context = makeContext({ accept: 'application/*' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when Accept header does not include JSON', () => {
    const context = makeContext({ accept: 'text/html' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when Accept header is absent', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          path: '/article',
          url: '/article',
          headers: {},
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows swagger UI paths without checking Accept header', () => {
    const context = makeContext({ path: '/doc', accept: 'text/html' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows swagger UI sub-paths without checking Accept header', () => {
    const context = makeContext({
      path: '/doc/swagger-ui.css',
      accept: 'text/css',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows OpenAPI JSON path without checking Accept header', () => {
    const context = makeContext({ path: '/doc-json', accept: '' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows OpenAPI YAML path without checking Accept header', () => {
    const context = makeContext({ path: '/doc-yaml', accept: '' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows auth signup path without checking Accept header', () => {
    const context = makeContext({ path: '/auth/signup', accept: '' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
