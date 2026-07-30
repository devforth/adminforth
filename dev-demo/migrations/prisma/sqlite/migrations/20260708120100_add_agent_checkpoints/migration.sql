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
