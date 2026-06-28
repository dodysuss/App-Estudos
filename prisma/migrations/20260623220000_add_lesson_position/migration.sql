ALTER TABLE "Lesson"
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

UPDATE "Lesson"
SET "position" = "lessonNumber";

CREATE INDEX "Lesson_courseId_moduleId_position_idx"
ON "Lesson"("courseId", "moduleId", "position");
