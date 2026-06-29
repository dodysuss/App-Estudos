-- CreateTable
CREATE TABLE "DigitalAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "assetType" TEXT NOT NULL DEFAULT 'Nota',
    "content" TEXT,
    "coverImage" TEXT,
    "coverColor" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalAsset_userId_archived_pinned_updatedAt_idx" ON "DigitalAsset"("userId", "archived", "pinned", "updatedAt");

-- CreateIndex
CREATE INDEX "DigitalAsset_userId_favorite_idx" ON "DigitalAsset"("userId", "favorite");

-- CreateIndex
CREATE INDEX "DigitalAsset_userId_category_idx" ON "DigitalAsset"("userId", "category");

-- CreateIndex
CREATE INDEX "DigitalAsset_userId_assetType_idx" ON "DigitalAsset"("userId", "assetType");

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
