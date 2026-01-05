-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "price" NUMERIC(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engine_type" TEXT,
    "engine_power" INTEGER,
    "production_year" INTEGER,
    "description" TEXT,
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "mileage" DOUBLE PRECISION,
    "color" TEXT,
    "body_type" TEXT,
    "photos" TEXT,
    "seller_id" TEXT,
    "seller" TEXT,
    "promo_picture" TEXT,
    "generated_promo_picture" TEXT,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);
