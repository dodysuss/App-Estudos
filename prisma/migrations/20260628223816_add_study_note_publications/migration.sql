-- CreateTable
CREATE TABLE "StudyNotePublication" (
    "id" TEXT NOT NULL,
    "studyNoteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyNotePublication_pkey" PRIMARY KEY ("id")
);

-- Preserve already published notes from the previous single-publication fields.
INSERT INTO "StudyNotePublication" ("id", "studyNoteId", "content", "createdAt", "updatedAt")
SELECT
    "id",
    "id",
    "publishedContent",
    COALESCE("publishedAt", "updatedAt"),
    COALESCE("publishedAt", "updatedAt")
FROM "StudyNote"
WHERE "publishedContent" IS NOT NULL
  AND length(trim("publishedContent")) > 0;

-- CreateIndex
CREATE INDEX "StudyNotePublication_studyNoteId_createdAt_idx" ON "StudyNotePublication"("studyNoteId", "createdAt");

-- AddForeignKey
ALTER TABLE "StudyNotePublication" ADD CONSTRAINT "StudyNotePublication_studyNoteId_fkey" FOREIGN KEY ("studyNoteId") REFERENCES "StudyNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
