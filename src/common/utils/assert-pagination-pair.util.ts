import { BadRequestException } from '@nestjs/common';

export const assertPaginationPair = (query: {
  page?: number;
  limit?: number;
}) => {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;
  if (hasPage !== hasLimit) {
    throw new BadRequestException(
      'page and limit must both be provided for pagination',
    );
  }
};
