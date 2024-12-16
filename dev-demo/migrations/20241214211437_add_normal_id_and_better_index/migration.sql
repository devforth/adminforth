/*
  Warnings:

  - The primary key for the `translations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `translations` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

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
    "category" TEXT,
    "source" TEXT NOT NULL,
    "completedLangs" TEXT
);
INSERT INTO "new_translations" ("category", "completedLangs", "created_at", "en_string", "es_string", "fr_string", "ja_string", "source", "uk_string") SELECT "category", "completedLangs", "created_at", "en_string", "es_string", "fr_string", "ja_string", "source", "uk_string" FROM "translations";
DROP TABLE "translations";
ALTER TABLE "new_translations" RENAME TO "translations";
CREATE INDEX "translations_en_string_category_idx" ON "translations"("en_string", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
