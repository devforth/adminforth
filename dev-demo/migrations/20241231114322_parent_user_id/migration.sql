/*
  Warnings:

  - You are about to drop the column `parentGameId` on the `users` table. All the data in the column will be lost.

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
    "parentUserId" TEXT
);
INSERT INTO "new_users" ("created_at", "email", "email_confirmed", "id", "last_login_ip", "password_hash", "role", "secret2fa") SELECT "created_at", "email", "email_confirmed", "id", "last_login_ip", "password_hash", "role", "secret2fa" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
