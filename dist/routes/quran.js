"use strict";
import { Router } from "express";
import { prisma } from "../db/client.js";
import { buildMeta, parsePagination } from "../lib/pagination.js";
const router = Router();
const DEFAULT_EDITION_SLUG = "en-sahih";
function badRequest(res, message) {
    return res.status(400).json({ error: "bad_request", message });
}
function notFound(res, message) {
    return res.status(404).json({ error: "not_found", message });
}
/** GET /api/surahs — paginated list of all surahs (Arabic + English names). */
router.get("/surahs", async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, {
        defaultLimit: 20,
        maxLimit: 114,
    });
    const total = await prisma.surah.count();
    if (total === 0) {
        return res.status(503).json({
            error: "no_data",
            message: "No Quran data in the database. Run: npm run db:seed",
        });
    }
    const surahs = await prisma.surah.findMany({
        orderBy: { id: "asc" },
        skip,
        take: limit,
        select: {
            id: true,
            nameArabic: true,
            nameTransliterated: true,
            nameEnglish: true,
            revelationType: true,
            ayahCount: true,
        },
    });
    return res.json({
        data: surahs,
        pagination: buildMeta(total, page, limit),
    });
});
/** GET /api/surahs/:surahNumber/ayat — verses for one surah with Arabic + translation. */
router.get("/surahs/:surahNumber/ayat", async (req, res) => {
    const raw = req.params.surahNumber;
    const surahNumber = Number.parseInt(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "", 10);
    if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
        return badRequest(res, "surahNumber must be between 1 and 114");
    }
    const editionSlug = typeof req.query.edition === "string" && req.query.edition.length > 0
        ? req.query.edition
        : DEFAULT_EDITION_SLUG;
    const edition = await prisma.translationEdition.findUnique({
        where: { slug: editionSlug },
    });
    if (!edition) {
        return notFound(res, `Translation edition not found: ${editionSlug}`);
    }
    const surah = await prisma.surah.findUnique({
        where: { id: surahNumber },
    });
    if (!surah) {
        return notFound(res, `Surah ${surahNumber} not found`);
    }
    const { page, limit, skip } = parsePagination(req.query, {
        defaultLimit: 50,
        maxLimit: 300,
    });
    const whereAyah = { surahId: surahNumber };
    const total = await prisma.ayah.count({ where: whereAyah });
    const ayat = await prisma.ayah.findMany({
        where: whereAyah,
        orderBy: { verseInSurah: "asc" },
        skip,
        take: limit,
        select: {
            id: true,
            verseInSurah: true,
            globalVerseIndex: true,
            textUthmani: true,
            pageStart: true,
            juzNumber: true,
            hizbNumber: true,
            sajdahType: true,
            translations: {
                where: { editionId: edition.id },
                select: { text: true },
                take: 1,
            },
        },
    });
    const data = ayat.map((a) => ({
        id: a.id,
        verseInSurah: a.verseInSurah,
        globalVerseIndex: a.globalVerseIndex,
        textArabic: a.textUthmani,
        textTranslation: a.translations[0]?.text ?? null,
        page: a.pageStart,
        juz: a.juzNumber,
        hizbQuarter: a.hizbNumber,
        sajdahType: a.sajdahType,
    }));
    return res.json({
        surah: {
            id: surah.id,
            nameArabic: surah.nameArabic,
            nameTransliterated: surah.nameTransliterated,
            nameEnglish: surah.nameEnglish,
            revelationType: surah.revelationType,
            ayahCount: surah.ayahCount,
        },
        edition: { slug: edition.slug, name: edition.name, languageCode: edition.languageCode },
        data,
        pagination: buildMeta(total, page, limit),
    });
});
/** GET /api/ayat/search?q= — search ayahs by translation text (case-insensitive). */
router.get("/ayat/search", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
        return badRequest(res, "Query parameter q must be at least 2 characters");
    }
    const editionSlug = typeof req.query.edition === "string" && req.query.edition.length > 0
        ? req.query.edition
        : DEFAULT_EDITION_SLUG;
    const edition = await prisma.translationEdition.findUnique({
        where: { slug: editionSlug },
    });
    if (!edition) {
        return notFound(res, `Translation edition not found: ${editionSlug}`);
    }
    const { page, limit, skip } = parsePagination(req.query, {
        defaultLimit: 20,
        maxLimit: 50,
    });
    const whereTranslation = {
        editionId: edition.id,
        text: { contains: q, mode: "insensitive" },
    };
    const total = await prisma.ayahTranslation.count({
        where: whereTranslation,
    });
    const rows = await prisma.ayahTranslation.findMany({
        where: whereTranslation,
        orderBy: { ayah: { globalVerseIndex: "asc" } },
        skip,
        take: limit,
        select: {
            text: true,
            ayah: {
                select: {
                    verseInSurah: true,
                    globalVerseIndex: true,
                    textUthmani: true,
                    surah: {
                        select: {
                            id: true,
                            nameArabic: true,
                            nameEnglish: true,
                            nameTransliterated: true,
                        },
                    },
                },
            },
        },
    });
    const results = rows.map((row) => ({
        surahNumber: row.ayah.surah.id,
        surahNameArabic: row.ayah.surah.nameArabic,
        surahNameEnglish: row.ayah.surah.nameEnglish,
        surahNameTransliterated: row.ayah.surah.nameTransliterated,
        verseInSurah: row.ayah.verseInSurah,
        globalVerseIndex: row.ayah.globalVerseIndex,
        textArabic: row.ayah.textUthmani,
        textTranslation: row.text,
    }));
    return res.json({
        query: q,
        edition: { slug: edition.slug, name: edition.name },
        results,
        pagination: buildMeta(total, page, limit),
    });
});
export { router as quranRouter };
