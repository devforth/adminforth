-- CreateTable
CREATE TABLE "crud_manual_approve" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "record_id" TEXT,
    "resource_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "responser_id" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extra" JSONB
);

-- CreateIndex
CREATE INDEX "crud_manual_approve_status_created_at_idx" ON "crud_manual_approve"("status", "created_at");

-- CreateIndex
CREATE INDEX "crud_manual_approve_resource_id_idx" ON "crud_manual_approve"("resource_id");
