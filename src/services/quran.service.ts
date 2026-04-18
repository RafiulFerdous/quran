import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/client.js";
import { buildMeta, type PaginationMeta } from "../lib/pagination.js";
import { DEFAULT_EDITION_SLUG } from "../constants/quran.js";

export type SurahListItem = {
  id: number;
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string | null;
  revelationType: string;
  ayahCount: number;
};

export type ListSurahsResult =
  | { kind: "no_data" }
  | {
      kind: "ok";
      surahs: SurahListItem[];
      pagination: PaginationMeta;
    };

export type AyatRow = {
  id: string;
  verseInSurah: number;
  globalVerseIndex: number | null;
  textArabic: string;
  textTranslation: string | null;
  page: number | null;
  juz: number | null;
  hizbQuarter: number | null;
  sajdahType: string;
};

export type GetAyatResult =
  | { kind: "edition_not_found"; slug: string }
  | { kind: "surah_not_found"; surahNumber: number }
  | {
      kind: "ok";
      surah: {
        id: number;
        nameArabic: string;
        nameTransliterated: string;
        nameEnglish: string | null;
        revelationType: string;
        ayahCount: number;
      };
      edition: {
        slug: string;
        name: string;
        languageCode: string;
      };
      data: AyatRow[];
      pagination: PaginationMeta;
    };

export type SearchResultRow = {
  surahNumber: number;
  surahNameArabic: string;
  surahNameEnglish: string | null;
  surahNameTransliterated: string;
  verseInSurah: number;
  globalVerseIndex: number | null;
  textArabic: string;
  textTranslation: string;
};

export type SearchAyatResult =
  | { kind: "edition_not_found"; slug: string }
  | {
      kind: "ok";
      query: string;
      edition: { slug: string; name: string };
      results: SearchResultRow[];
      pagination: PaginationMeta;
    };

export async function listSurahsPaginated(
  page: number,
  limit: number,
  skip: number
): Promise<ListSurahsResult> {
  const total = await prisma.surah.count();
  if (total === 0) {
    return { kind: "no_data" };
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

  return {
    kind: "ok",
    surahs,
    pagination: buildMeta(total, page, limit),
  };
}

export async function getAyatForSurahPaginated(
  surahNumber: number,
  editionSlug: string,
  page: number,
  limit: number,
  skip: number
): Promise<GetAyatResult> {
  const slug = editionSlug || DEFAULT_EDITION_SLUG;

  const edition = await prisma.translationEdition.findUnique({
    where: { slug },
  });
  if (!edition) {
    return { kind: "edition_not_found", slug };
  }

  const surah = await prisma.surah.findUnique({
    where: { id: surahNumber },
  });
  if (!surah) {
    return { kind: "surah_not_found", surahNumber };
  }

  const whereAyah: Prisma.AyahWhereInput = { surahId: surahNumber };
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

  const data: AyatRow[] = ayat.map((a) => ({
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

  return {
    kind: "ok",
    surah: {
      id: surah.id,
      nameArabic: surah.nameArabic,
      nameTransliterated: surah.nameTransliterated,
      nameEnglish: surah.nameEnglish,
      revelationType: surah.revelationType,
      ayahCount: surah.ayahCount,
    },
    edition: {
      slug: edition.slug,
      name: edition.name,
      languageCode: edition.languageCode,
    },
    data,
    pagination: buildMeta(total, page, limit),
  };
}

export async function searchAyatByTranslation(
  query: string,
  editionSlug: string,
  page: number,
  limit: number,
  skip: number
): Promise<SearchAyatResult> {
  const slug = editionSlug || DEFAULT_EDITION_SLUG;

  const edition = await prisma.translationEdition.findUnique({
    where: { slug },
  });
  if (!edition) {
    return { kind: "edition_not_found", slug };
  }

  const whereTranslation: Prisma.AyahTranslationWhereInput = {
    editionId: edition.id,
    text: { contains: query, mode: "insensitive" },
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

  const results: SearchResultRow[] = rows.map((row) => ({
    surahNumber: row.ayah.surah.id,
    surahNameArabic: row.ayah.surah.nameArabic,
    surahNameEnglish: row.ayah.surah.nameEnglish,
    surahNameTransliterated: row.ayah.surah.nameTransliterated,
    verseInSurah: row.ayah.verseInSurah,
    globalVerseIndex: row.ayah.globalVerseIndex,
    textArabic: row.ayah.textUthmani,
    textTranslation: row.text,
  }));

  return {
    kind: "ok",
    query,
    edition: { slug: edition.slug, name: edition.name },
    results,
    pagination: buildMeta(total, page, limit),
  };
}
