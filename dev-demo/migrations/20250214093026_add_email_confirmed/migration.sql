-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "apartment_buyers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "info" TEXT,
    "contact_info" TEXT,
    "language" TEXT,
    "ideal_price" DECIMAL,
    "ideal_space" REAL,
    "ideal_subway_distance" REAL,
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "contact_date" DATETIME,
    "contact_time" DATETIME,
    "realtor_id" TEXT
);
