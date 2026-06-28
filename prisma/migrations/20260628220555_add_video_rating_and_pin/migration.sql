-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Lesson_courseId_pinned_position_idx" ON "Lesson"("courseId", "pinned", "position");
