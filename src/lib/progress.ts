export type ProgressStatus = "not-started" | "in-progress" | "completed";

export function calculateProgress(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getProgressStatus(completed: number, total: number): ProgressStatus {
  if (completed === 0) return "not-started";
  if (completed >= total) return "completed";
  return "in-progress";
}

export function getNextLesson(lessons: Array<{ lessonNumber: number; completed: boolean }>) {
  return [...lessons]
    .sort((a, b) => a.lessonNumber - b.lessonNumber)
    .find((lesson) => !lesson.completed)?.lessonNumber;
}
