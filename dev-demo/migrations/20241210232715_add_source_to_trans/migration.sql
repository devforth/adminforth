/*
  Warnings:

  - Added the required column `source` to the `translations` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_translations" (
    "en_string" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "uk_string" TEXT NOT NULL,
    "ja_string" TEXT NOT NULL,
    "fr_string" TEXT NOT NULL,
    "es_string" TEXT NOT NULL,
    "source" TEXT NOT NULL
);
INSERT INTO "new_translations" ("created_at", "en_string", "es_string", "fr_string", "ja_string", "uk_string") SELECT "created_at", "en_string", "es_string", "fr_string", "ja_string", "uk_string" FROM "translations";
DROP TABLE "translations";
ALTER TABLE "new_translations" RENAME TO "translations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
