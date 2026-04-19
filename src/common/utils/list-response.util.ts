import { BadRequestException } from '@nestjs/common';

export type PaginatedList<T> = {
  total: number;
  page: number;
  limit: number;
  data: T[];
};

const normalizeSortOrder = (order?: string): 'asc' | 'desc' =>
  !order || order.toLowerCase() === 'asc' ? 'asc' : 'desc';

const compareForSort = (valueA: unknown, valueB: unknown): number => {
  if (valueA === valueB) return 0;
  if (valueA === null || valueA === undefined) return -1;
  if (valueB === null || valueB === undefined) return 1;
  if (typeof valueA === 'string' && typeof valueB === 'string') {
    return valueA.localeCompare(valueB);
  }
  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return valueA - valueB;
  }
  return String(valueA).localeCompare(String(valueB));
};

const sortList = <T extends object>(
  items: T[],
  sortBy: keyof T,
  order: 'asc' | 'desc',
): T[] => {
  const direction = order === 'asc' ? 1 : -1;
  return [...items].sort(
    (itemA, itemB) => direction * compareForSort(itemA[sortBy], itemB[sortBy]),
  );
};

const slicePage = <T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedList<T> => ({
  total: items.length,
  page,
  limit,
  data: items.slice((page - 1) * limit, page * limit),
});

export type ListResponseOptions<T extends object> = {
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
  allowedSortKeys: readonly (keyof T)[];
};

export const buildListResponse = <T extends object>(
  items: T[],
  options: ListResponseOptions<T>,
): T[] | PaginatedList<T> => {
  let result = items;
  if (options.sortBy) {
    if (!options.allowedSortKeys.includes(options.sortBy as keyof T)) {
      throw new BadRequestException(`Invalid sortBy: ${options.sortBy}`);
    }
    result = sortList(
      result,
      options.sortBy as keyof T,
      normalizeSortOrder(options.order),
    );
  }
  if (options.page !== undefined && options.limit !== undefined) {
    return slicePage(result, options.page, options.limit);
  }
  return result;
};
