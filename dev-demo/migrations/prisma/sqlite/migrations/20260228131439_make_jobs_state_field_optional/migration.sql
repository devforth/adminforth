-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_jobs" (
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
INSERT INTO "new_jobs" ("created_at", "finished_at", "id", "job_handler_name", "name", "progress", "started_by", "state", "status") SELECT "created_at", "finished_at", "id", "job_handler_name", "name", "progress", "started_by", "state", "status" FROM "jobs";
DROP TABLE "jobs";
ALTER TABLE "new_jobs" RENAME TO "jobs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
