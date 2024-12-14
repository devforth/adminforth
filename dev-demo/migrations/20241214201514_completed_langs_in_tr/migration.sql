/*
  Warnings:

  - You are about to drop the column `completed` on the `translations` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_translations" (
    "en_string" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "uk_string" TEXT,
    "ja_string" TEXT,
    "fr_string" TEXT,
    "es_string" TEXT,
    "category" TEXT,
    "source" TEXT NOT NULL,
    "completedLangs" TEXT
);
INSERT INTO "new_translations" ("category", "created_at", "en_string", "es_string", "fr_string", "ja_string", "source", "uk_string") SELECT "category", "created_at", "en_string", "es_string", "fr_string", "ja_string", "source", "uk_string" FROM "translations";
DROP TABLE "translations";
ALTER TABLE "new_translations" RENAME TO "translations";
CREATE INDEX "translations_category_idx" ON "translations"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
