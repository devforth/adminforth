-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_adminuser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "secret2fa" TEXT,
    "responsible_person" TEXT,
    "avatar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_adminuser" ("avatar", "created_at", "email", "id", "password_hash", "responsible_person", "role", "secret2fa") SELECT "avatar", "created_at", "email", "id", "password_hash", "responsible_person", "role", "secret2fa" FROM "adminuser";
DROP TABLE "adminuser";
ALTER TABLE "new_adminuser" RENAME TO "adminuser";
CREATE UNIQUE INDEX "adminuser_email_key" ON "adminuser"("email");
CREATE INDEX "adminuser_is_active_idx" ON "adminuser"("is_active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
