/*
  Warnings:

  - You are about to alter the column `price` on the `cars` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "finished_at" DATETIME,
    "started_by" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "progress" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "job_handler_name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cars" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engine_type" TEXT,
    "engine_power" INTEGER,
    "production_year" INTEGER,
    "description" TEXT,
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "mileage" REAL,
    "color" TEXT,
    "body_type" TEXT,
    "photos" TEXT,
    "seller_id" TEXT,
    "seller" TEXT,
    "promo_picture" TEXT,
    "generated_promo_picture" TEXT
);
INSERT INTO "new_cars" ("body_type", "color", "created_at", "description", "engine_power", "engine_type", "generated_promo_picture", "id", "listed", "mileage", "model", "photos", "price", "production_year", "promo_picture", "seller", "seller_id") SELECT "body_type", "color", "created_at", "description", "engine_power", "engine_type", "generated_promo_picture", "id", "listed", "mileage", "model", "photos", "price", "production_year", "promo_picture", "seller", "seller_id" FROM "cars";
DROP TABLE "cars";
ALTER TABLE "new_cars" RENAME TO "cars";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
