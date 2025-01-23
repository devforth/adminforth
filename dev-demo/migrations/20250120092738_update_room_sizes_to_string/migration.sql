-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_apartments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME,
    "title" TEXT NOT NULL,
    "square_meter" REAL,
    "price" DECIMAL NOT NULL,
    "number_of_rooms" INTEGER,
    "room_sizes" TEXT,
    "description" TEXT,
    "country" TEXT,
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "realtor_id" TEXT,
    "user_id" TEXT,
    "apartment_image" TEXT
);
INSERT INTO "new_apartments" ("apartment_image", "country", "created_at", "description", "id", "listed", "number_of_rooms", "price", "realtor_id", "room_sizes", "square_meter", "title", "user_id") SELECT "apartment_image", "country", "created_at", "description", "id", "listed", "number_of_rooms", "price", "realtor_id", "room_sizes", "square_meter", "title", "user_id" FROM "apartments";
DROP TABLE "apartments";
ALTER TABLE "new_apartments" RENAME TO "apartments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
