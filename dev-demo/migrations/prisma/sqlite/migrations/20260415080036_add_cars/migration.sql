/*
  Warnings:

  - You are about to drop the column `listed` on the `translations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "adminuser" ADD COLUMN "cars" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_translations" (
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
INSERT INTO "new_translations" ("category", "completedLangs", "created_at", "en_string", "es_string", "fr_string", "id", "ja_string", "ptBR_string", "source", "uk_string") SELECT "category", "completedLangs", "created_at", "en_string", "es_string", "fr_string", "id", "ja_string", "ptBR_string", "source", "uk_string" FROM "translations";
DROP TABLE "translations";
ALTER TABLE "new_translations" RENAME TO "translations";
CREATE INDEX "translations_en_string_category_idx" ON "translations"("en_string", "category");
CREATE INDEX "translations_category_idx" ON "translations"("category");
CREATE INDEX "translations_completedLangs_idx" ON "translations"("completedLangs");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
