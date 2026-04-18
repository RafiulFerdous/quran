-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "Ayah_textUthmani_idx" ON "Ayah" USING GIN ("textUthmani" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "AyahTranslation_text_idx" ON "AyahTranslation" USING GIN ("text" gin_trgm_ops);
