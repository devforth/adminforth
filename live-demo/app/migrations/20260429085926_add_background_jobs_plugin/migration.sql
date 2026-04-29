-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "finished_at" DATETIME,
    "started_by" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "progress" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "job_handler_name" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "translations_completedLangs_idx" ON "translations"("completedLangs");
