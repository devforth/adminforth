-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "attempts" INTEGER NOT NULL,
    "ip" TEXT,
    "country" TEXT,
    "user_agent" TEXT,
    "ips" TEXT
);

-- CreateIndex
CREATE INDEX "login_history_user_id_success_created_at_idx" ON "login_history"("user_id", "success", "created_at");
