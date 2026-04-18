-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RevelationType" AS ENUM ('MECCAN', 'MEDINAN');

-- CreateEnum
CREATE TYPE "SajdahType" AS ENUM ('NONE', 'RECOMMENDED', 'OBLIGATORY');

-- CreateTable
CREATE TABLE "Surah" (
    "id" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "nameTransliterated" TEXT NOT NULL,
    "nameEnglish" TEXT,
    "revelationType" "RevelationType" NOT NULL,
    "ayahCount" INTEGER NOT NULL,

    CONSTRAINT "Surah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ayah" (
    "id" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "verseInSurah" INTEGER NOT NULL,
    "textUthmani" TEXT NOT NULL,
    "globalVerseIndex" INTEGER,
    "pageStart" INTEGER,
    "juzNumber" INTEGER,
    "hizbNumber" INTEGER,
    "sajdahType" "SajdahType" NOT NULL DEFAULT 'NONE',

    CONSTRAINT "Ayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationEdition" (
    "id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TranslationEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyahTranslation" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "ayahId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "AyahTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ayah_globalVerseIndex_key" ON "Ayah"("globalVerseIndex");

-- CreateIndex
CREATE INDEX "Ayah_surahId_idx" ON "Ayah"("surahId");

-- CreateIndex
CREATE INDEX "Ayah_pageStart_idx" ON "Ayah"("pageStart");

-- CreateIndex
CREATE INDEX "Ayah_juzNumber_idx" ON "Ayah"("juzNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ayah_surahId_verseInSurah_key" ON "Ayah"("surahId", "verseInSurah");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationEdition_slug_key" ON "TranslationEdition"("slug");

-- CreateIndex
CREATE INDEX "AyahTranslation_ayahId_idx" ON "AyahTranslation"("ayahId");

-- CreateIndex
CREATE UNIQUE INDEX "AyahTranslation_editionId_ayahId_key" ON "AyahTranslation"("editionId", "ayahId");

-- AddForeignKey
ALTER TABLE "Ayah" ADD CONSTRAINT "Ayah_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahTranslation" ADD CONSTRAINT "AyahTranslation_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TranslationEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahTranslation" ADD CONSTRAINT "AyahTranslation_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
