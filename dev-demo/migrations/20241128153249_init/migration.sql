-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "secret2fa" TEXT
);

-- CreateTable
CREATE TABLE "apartments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME,
    "title" TEXT NOT NULL,
    "square_meter" REAL,
    "price" DECIMAL NOT NULL,
    "number_of_rooms" INTEGER,
    "description" TEXT,
    "country" TEXT,
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "realtor_id" TEXT,
    "property_type" TEXT NOT NULL DEFAULT 'apartment',
    "user_id" TEXT
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" TEXT,
    "record_id" TEXT,
    "ip_address" TEXT
);

-- CreateTable
CREATE TABLE "description_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "resource_id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "image_path" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
