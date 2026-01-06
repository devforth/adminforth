-- AlterTable
ALTER TABLE "adminuser" ADD COLUMN "secret2fa" TEXT;

-- CreateTable
CREATE TABLE "passkeys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credential_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meta" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "passkeys_user_id_idx" ON "passkeys"("user_id");

-- CreateIndex
CREATE INDEX "passkeys_credential_id_idx" ON "passkeys"("credential_id");
