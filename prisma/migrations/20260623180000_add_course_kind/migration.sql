-- Existing records remain regular courses.
ALTER TABLE "Course"
ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'COURSE';

CREATE INDEX "Course_kind_idx" ON "Course"("kind");
