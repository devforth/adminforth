-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "en_string" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "uk_string" TEXT,
    "ja_string" TEXT,
    "fr_string" TEXT,
    "es_string" TEXT,
    "ptBR_string" TEXT,
    "category" TEXT NOT NULL,
    "source" TEXT,
    "completedLangs" TEXT
);

-- CreateIndex
CREATE INDEX "translations_en_string_category_idx" ON "translations"("en_string", "category");

-- CreateIndex
CREATE INDEX "translations_category_idx" ON "translations"("category");

-- CreateIndex
CREATE INDEX "translations_completedLangs_idx" ON "translations"("completedLangs");
