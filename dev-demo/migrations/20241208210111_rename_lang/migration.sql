/*
  Warnings:

  - You are about to drop the column `jp_string` on the `translations` table. All the data in the column will be lost.
  - Added the required column `ja_string` to the `translations` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_translations" (
    "en_string" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "uk_string" TEXT NOT NULL,
    "ja_string" TEXT NOT NULL,
    "fr_string" TEXT NOT NULL
);
INSERT INTO "new_translations" ("created_at", "en_string", "fr_string", "uk_string") SELECT "created_at", "en_string", "fr_string", "uk_string" FROM "translations";
DROP TABLE "translations";
ALTER TABLE "new_translations" RENAME TO "translations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
