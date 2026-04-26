import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertPaginationPair } from './assert-pagination-pair.util';

describe('assertPaginationPair', () => {
  it('does not throw when both page and limit are provided', () => {
    expect(() => assertPaginationPair({ page: 1, limit: 10 })).not.toThrow();
  });

  it('does not throw when neither page nor limit are provided', () => {
    expect(() => assertPaginationPair({})).not.toThrow();
  });

  it('throws BadRequestException when only page is provided', () => {
    expect(() => assertPaginationPair({ page: 1 })).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when only limit is provided', () => {
    expect(() => assertPaginationPair({ limit: 10 })).toThrow(
      BadRequestException,
    );
  });
});
