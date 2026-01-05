-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
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
    "seller" TEXT
);
