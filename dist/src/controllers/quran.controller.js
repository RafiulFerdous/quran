import { DEFAULT_EDITION_SLUG } from "../constants/quran.js";
import { parsePagination } from "../lib/pagination.js";
import * as quranService from "../services/quran.service.js";
function badRequest(res, message) {
    return res.status(400).json({ error: "bad_request", message });
}
function notFound(res, message) {
    return res.status(404).json({ error: "not_found", message });
}
export async function listSurahs(req, res) {
    const { page, limit, skip } = parsePagination(req.query, {
        defaultLimit: 20,
        maxLimit: 114,
    });
    const result = await quranService.listSurahsPaginated(page, limit, skip);
    if (result.kind === "no_data") {
        return res.status(503).json({
            error: "no_data",
            message: "No Quran data in the database. Run: npm run db:seed",
        });
    }
    return res.json({
        data: result.surahs,
        pagination: result.pagination,
    });
}
export async function getAyatBySurah(req, res) {
    const raw = req.params.surahNumber;
    const surahNumber = Number.parseInt(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "", 10);
    if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
        return badRequest(res, "surahNumber must be between 1 and 114");
    }
    const editionSlug = typeof req.query.edition === "string" && req.query.edition.length > 0
        ? req.query.edition
        : DEFAULT_EDITION_SLUG;
    const { page, limit, skip } = parsePagination(req.query, {
        defaultLimit: 50,
        maxLimit: 300,
    });
    const result = await quranService.getAyatForSurahPaginated(surahNumber, editionSlug, page, limit, skip);
    if (result.kind === "edition_not_found") {
        return notFound(res, `Translation edition not found: ${result.slug}`);
    }
    if (result.kind === "surah_not_found") {
        return notFound(res, `Surah ${result.surahNumber} not found`);
    }
    return res.json({
        surah: result.surah,
        edition: result.edition,
        data: result.data,
        pagination: result.pagination,
    });
}
export async function searchAyat(req, res) {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
        return badRequest(res, "Query parameter q must be at least 2 characters");
    }
    const editionSlug = typeof req.query.edition === "string" && req.query.edition.length > 0
        ? req.query.edition
        : DEFAULT_EDITION_SLUG;
    const { page, limit, skip } = parsePagination(req.query, {
        defaultLimit: 20,
        maxLimit: 50,
    });
    const result = await quranService.searchAyatByTranslation(q, editionSlug, page, limit, skip);
    if (result.kind === "edition_not_found") {
        return notFound(res, `Translation edition not found: ${result.slug}`);
    }
    return res.json({
        query: result.query,
        edition: result.edition,
        results: result.results,
        pagination: result.pagination,
    });
}
