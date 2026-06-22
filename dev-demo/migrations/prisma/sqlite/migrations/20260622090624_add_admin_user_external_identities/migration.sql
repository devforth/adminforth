-- CreateTable
CREATE TABLE "AdminUserExternalIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "externalUserId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AdminUserExternalIdentity_adminUserId_idx" ON "AdminUserExternalIdentity"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUserExternalIdentity_provider_subject_key" ON "AdminUserExternalIdentity"("provider", "subject");
