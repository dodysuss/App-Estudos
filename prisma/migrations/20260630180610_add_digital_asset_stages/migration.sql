-- CreateTable
CREATE TABLE "DigitalAssetStage" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalAssetStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalAssetStage_assetId_idx" ON "DigitalAssetStage"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalAssetStage_assetId_position_key" ON "DigitalAssetStage"("assetId", "position");

-- AddForeignKey
ALTER TABLE "DigitalAssetStage" ADD CONSTRAINT "DigitalAssetStage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
