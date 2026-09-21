-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "executed_by" TEXT;

-- CreateTable
CREATE TABLE "mcp_auth_secrets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "last_used_at" DATETIME,
    "last_used_by_agent" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "mcp_auth_secrets_secret_hash_key" ON "mcp_auth_secrets"("secret_hash");

-- CreateIndex
CREATE INDEX "mcp_auth_secrets_user_id_idx" ON "mcp_auth_secrets"("user_id");
