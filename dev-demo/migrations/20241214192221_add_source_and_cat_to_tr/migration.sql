-- AlterTable
ALTER TABLE "translations" ADD COLUMN "category" TEXT;

-- CreateIndex
CREATE INDEX "translations_category_idx" ON "translations"("category");
