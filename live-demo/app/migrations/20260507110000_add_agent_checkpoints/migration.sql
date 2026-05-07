-- CreateTable
CREATE TABLE "agent_checkpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "thread_id" TEXT NOT NULL,
    "checkpoint_namespace" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "parent_checkpoint_id" TEXT,
    "row_kind" TEXT NOT NULL,
    "task_id" TEXT,
    "sequence" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL,
    "checkpoint_payload" TEXT,
    "metadata_payload" TEXT,
    "writes_payload" TEXT,
    "schema_version" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "agent_checkpoints_thread_id_checkpoint_namespace_checkpoint_id_idx" ON "agent_checkpoints"("thread_id", "checkpoint_namespace", "checkpoint_id");

-- CreateIndex
CREATE INDEX "agent_checkpoints_created_at_idx" ON "agent_checkpoints"("created_at");
