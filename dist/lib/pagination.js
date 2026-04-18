"use strict";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
export function parsePagination(query, opts = {}) {
    const defaultLimit = opts.defaultLimit ?? DEFAULT_LIMIT;
    const maxLimit = opts.maxLimit ?? 100;
    const rawPage = Number(Array.isArray(query.page) ? query.page[0] : query.page);
    const rawLimit = Number(Array.isArray(query.limit) ? query.limit[0] : query.limit);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
    const limitRaw = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.floor(rawLimit) : defaultLimit;
    const limit = Math.min(limitRaw, maxLimit);
    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
}
export function buildMeta(total, page, limit) {
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
