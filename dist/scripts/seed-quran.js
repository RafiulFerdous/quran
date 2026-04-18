/**
 * Seeds Surah, Ayah, and English (Sahih International) translations from
 * Al Quran Cloud — open API: https://alquran.cloud/api
 *
 * Data source: https://api.alquran.cloud/v1 (no API key required).
 */
import "dotenv/config";
import { prisma, disconnectDb } from "../src/db/client.js";
const API = "https://api.alquran.cloud/v1";
function revelationType(api) {
    return api === "Medinan" ? "MEDINAN" : "MECCAN";
}
function sajdaType(sajda) {
    if (typeof sajda !== "object" || sajda === null)
        return "NONE";
    if (sajda.obligatory)
        return "OBLIGATORY";
    if (sajda.recommended)
        return "RECOMMENDED";
    return "NONE";
}
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return res.json();
}
async function main() {
    console.log("Fetching surah list…");
    const listPayload = await fetchJson(`${API}/surah`);
    const edition = await prisma.translationEdition.upsert({
        where: { slug: "en-sahih" },
        create: {
            languageCode: "en",
            name: "Sahih International",
            slug: "en-sahih",
            isDefault: true,
        },
        update: { isDefault: true },
    });
    let done = 0;
    for (const meta of listPayload.data) {
        const n = meta.number;
        const url = `${API}/surah/${n}/editions/quran-uthmani,en.sahih`;
        const payload = await fetchJson(url);
        const arabic = payload.data[0];
        const english = payload.data[1];
        if (!arabic?.ayahs?.length || !english?.ayahs?.length) {
            throw new Error(`Missing ayahs for surah ${n}`);
        }
        if (arabic.ayahs.length !== english.ayahs.length) {
            throw new Error(`Ayah count mismatch for surah ${n}`);
        }
        await prisma.surah.upsert({
            where: { id: n },
            create: {
                id: n,
                nameArabic: meta.name,
                nameTransliterated: meta.englishName,
                nameEnglish: meta.englishNameTranslation,
                revelationType: revelationType(meta.revelationType),
                ayahCount: meta.numberOfAyahs,
            },
            update: {
                nameArabic: meta.name,
                nameTransliterated: meta.englishName,
                nameEnglish: meta.englishNameTranslation,
                revelationType: revelationType(meta.revelationType),
                ayahCount: meta.numberOfAyahs,
            },
        });
        for (let i = 0; i < arabic.ayahs.length; i++) {
            const a = arabic.ayahs[i];
            const e = english.ayahs[i];
            const ayahRow = await prisma.ayah.upsert({
                where: {
                    surahId_verseInSurah: {
                        surahId: n,
                        verseInSurah: a.numberInSurah,
                    },
                },
                create: {
                    surahId: n,
                    verseInSurah: a.numberInSurah,
                    textUthmani: a.text,
                    globalVerseIndex: a.number,
                    pageStart: a.page,
                    juzNumber: a.juz,
                    hizbNumber: a.hizbQuarter,
                    sajdahType: sajdaType(a.sajda),
                },
                update: {
                    textUthmani: a.text,
                    globalVerseIndex: a.number,
                    pageStart: a.page,
                    juzNumber: a.juz,
                    hizbNumber: a.hizbQuarter,
                    sajdahType: sajdaType(a.sajda),
                },
            });
            await prisma.ayahTranslation.upsert({
                where: {
                    editionId_ayahId: {
                        editionId: edition.id,
                        ayahId: ayahRow.id,
                    },
                },
                create: {
                    editionId: edition.id,
                    ayahId: ayahRow.id,
                    text: e.text,
                },
                update: { text: e.text },
            });
        }
        done += 1;
        console.log(`Seeded surah ${n}/114 (${meta.englishName})`);
        await new Promise((r) => setTimeout(r, 80));
    }
    console.log(`Done. Seeded ${done} surahs and all ayahs.`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exitCode = 1;
})
    .finally(() => disconnectDb());
