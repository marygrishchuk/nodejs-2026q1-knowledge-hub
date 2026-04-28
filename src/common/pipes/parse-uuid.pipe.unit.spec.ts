import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ParseUUIDPipe } from './parse-uuid.pipe';

describe('ParseUUIDPipe', () => {
  const pipe = new ParseUUIDPipe();

  it('passes through a valid v4 UUID unchanged', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    expect(pipe.transform(validUUID)).toBe(validUUID);
  });

  it('passes through another valid UUID format', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    expect(pipe.transform(validUUID)).toBe(validUUID);
  });

  it('throws BadRequestException for a plain string', () => {
    expect(() => pipe.transform('not-a-uuid')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for an empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for a UUID with wrong segment lengths', () => {
    expect(() => pipe.transform('550e8400-e29b-41d4-a716')).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for a numeric string', () => {
    expect(() => pipe.transform('12345678')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for a malformed UUID with correct length', () => {
    expect(() =>
      pipe.transform('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'),
    ).toThrow(BadRequestException);
  });
});
