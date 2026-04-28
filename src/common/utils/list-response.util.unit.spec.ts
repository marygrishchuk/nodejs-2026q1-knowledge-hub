import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { buildListResponse } from './list-response.util';

type Item = {
  id: string;
  name: string;
  score: number;
  createdAt: number;
};

const makeItems = (): Item[] => [
  { id: 'uuid-3', name: 'Charlie', score: 30, createdAt: 3000 },
  { id: 'uuid-1', name: 'Alice', score: 10, createdAt: 1000 },
  { id: 'uuid-2', name: 'Bob', score: 20, createdAt: 2000 },
];

const allowedSortKeys: readonly (keyof Item)[] = [
  'id',
  'name',
  'score',
  'createdAt',
];

describe('buildListResponse', () => {
  it('returns all items in original order when no options provided', () => {
    const items = makeItems();

    const result = buildListResponse(items, { allowedSortKeys });

    expect(result).toEqual(items);
  });

  it('sorts string fields ascending by default', () => {
    const result = buildListResponse(makeItems(), {
      allowedSortKeys,
      sortBy: 'name',
    }) as Item[];

    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
    expect(result[2].name).toBe('Charlie');
  });

  it('sorts string fields descending when order=desc', () => {
    const result = buildListResponse(makeItems(), {
      allowedSortKeys,
      sortBy: 'name',
      order: 'desc',
    }) as Item[];

    expect(result[0].name).toBe('Charlie');
    expect(result[2].name).toBe('Alice');
  });

  it('sorts number fields ascending', () => {
    const result = buildListResponse(makeItems(), {
      allowedSortKeys,
      sortBy: 'score',
    }) as Item[];

    expect(result[0].score).toBe(10);
    expect(result[2].score).toBe(30);
  });

  it('sorts number fields descending', () => {
    const result = buildListResponse(makeItems(), {
      allowedSortKeys,
      sortBy: 'score',
      order: 'DESC',
    }) as Item[];

    expect(result[0].score).toBe(30);
    expect(result[2].score).toBe(10);
  });

  it('throws BadRequestException for invalid sortBy key', () => {
    expect(() =>
      buildListResponse(makeItems(), {
        allowedSortKeys,
        sortBy: 'nonexistent',
      }),
    ).toThrow(BadRequestException);
  });

  it('returns paginated response when page and limit are provided', () => {
    const result = buildListResponse(makeItems(), {
      allowedSortKeys,
      page: 1,
      limit: 2,
    }) as { total: number; page: number; limit: number; data: Item[] };

    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('returns correct page slice for page 2', () => {
    const result = buildListResponse(makeItems(), {
      allowedSortKeys,
      page: 2,
      limit: 2,
    }) as { total: number; data: Item[] };

    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(1);
  });

  it('combines sort and pagination', () => {
    const result = buildListResponse(makeItems(), {
      allowedSortKeys,
      sortBy: 'name',
      order: 'asc',
      page: 1,
      limit: 2,
    }) as { data: Item[] };

    expect(result.data[0].name).toBe('Alice');
    expect(result.data[1].name).toBe('Bob');
  });

  it('handles items with null values in sort gracefully', () => {
    const itemsWithNull = [
      {
        id: 'uuid-1',
        name: null as unknown as string,
        score: 10,
        createdAt: 1000,
      },
      { id: 'uuid-2', name: 'Bob', score: 20, createdAt: 2000 },
    ];

    expect(() =>
      buildListResponse(itemsWithNull, { allowedSortKeys, sortBy: 'name' }),
    ).not.toThrow();
  });
});
