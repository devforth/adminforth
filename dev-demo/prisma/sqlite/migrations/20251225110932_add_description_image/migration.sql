-- CreateTable
CREATE TABLE "cars_description_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "resource_id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "image_path" TEXT NOT NULL
);
