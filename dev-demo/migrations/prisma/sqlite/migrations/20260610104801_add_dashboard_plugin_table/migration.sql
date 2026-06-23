-- CreateTable
CREATE TABLE "dashboard_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "config" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_configs_slug_key" ON "dashboard_configs"("slug");

-- CreateIndex
CREATE INDEX "dashboard_configs_slug_idx" ON "dashboard_configs"("slug");
