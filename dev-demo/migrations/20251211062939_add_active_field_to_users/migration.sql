/*
  Warnings:

  - Added the required column `is_active` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "secret2fa" TEXT,
    "last_login_ip" TEXT,
    "email_confirmed" BOOLEAN DEFAULT false,
    "parentUserId" TEXT,
    "email_verified" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "email_confirmed", "email_verified", "id", "last_login_ip", "parentUserId", "password_hash", "role", "secret2fa") SELECT "created_at", "email", "email_confirmed", "email_verified", "id", "last_login_ip", "parentUserId", "password_hash", "role", "secret2fa" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_is_active_idx" ON "users"("is_active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
