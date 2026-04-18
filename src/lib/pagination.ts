const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export function parsePagination(
  query: Record<string, unknown>,
  opts: { defaultLimit?: number; maxLimit?: number } = {}
): { page: number; limit: number; skip: number } {
  const defaultLimit = opts.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = opts.maxLimit ?? 100;

  const rawPage = Number(
    Array.isArray(query.page) ? query.page[0] : query.page
  );
  const rawLimit = Number(
    Array.isArray(query.limit) ? query.limit[0] : query.limit
  );

  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const limitRaw =
    Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.floor(rawLimit) : defaultLimit;
  const limit = Math.min(limitRaw, maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
