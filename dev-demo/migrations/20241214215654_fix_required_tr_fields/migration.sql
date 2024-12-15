/*
  Warnings:

  - Made the column `category` on table `translations` required. This step will fail if there are existing NULL values in that column.

*/
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
    "category" TEXT NOT NULL,
    "source" TEXT,
    "completedLangs" TEXT
);
INSERT INTO "new_translations" ("category", "completedLangs", "created_at", "en_string", "es_string", "fr_string", "id", "ja_string", "source", "uk_string") SELECT "category", "completedLangs", "created_at", "en_string", "es_string", "fr_string", "id", "ja_string", "source", "uk_string" FROM "translations";
DROP TABLE "translations";
ALTER TABLE "new_translations" RENAME TO "translations";
CREATE INDEX "translations_en_string_category_idx" ON "translations"("en_string", "category");
CREATE INDEX "translations_category_idx" ON "translations"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
