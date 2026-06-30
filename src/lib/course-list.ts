import { prisma } from "@/lib/prisma";
import { calculateProgress, getNextLesson, getProgressStatus } from "@/lib/progress";
import { matchesStandardFilters, normalizeStandardSearchQuery } from "@/lib/search-filters";

export type CourseKind = "COURSE" | "VIDEO_PLAYLIST";

export type DecoratedCourse = {
  id: string;
  name: string;
  description: string | null;
  kind: CourseKind;
  folderId: string | null;
  subject: string | null;
  tags: string[];
  totalLessons: number;
  completedLessons: number;
  progress: number;
  nextLesson?: number;
  status: "not-started" | "in-progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
};

export async function getDecoratedCourses(userId: string, kind?: CourseKind): Promise<DecoratedCourse[]> {
  const courses = await prisma.course.findMany({
    where: { userId, ...(kind ? { kind } : {}) },
    include: { lessons: { select: { lessonNumber: true, completed: true } } },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((course) => {
    const completedLessons = course.lessons.filter((lesson) => lesson.completed).length;
    return {
      id: course.id,
      name: course.name,
      description: course.description,
      kind: course.kind === "VIDEO_PLAYLIST" ? "VIDEO_PLAYLIST" : "COURSE",
      folderId: course.folderId,
      subject: course.subject,
      tags: course.tags,
      totalLessons: course.totalLessons,
      completedLessons,
      progress: calculateProgress(completedLessons, course.totalLessons),
      nextLesson: getNextLesson(course.lessons),
      status: getProgressStatus(completedLessons, course.totalLessons),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  });
}

export function filterDecoratedCourses(
  courses: DecoratedCourse[],
  query: { search: string; semantic: string; category: string; tags: string[]; status: string; sort: string; folderId?: string },
) {
  return [...courses]
    .filter((course) =>
      matchesStandardFilters(
        {
          text: [
            course.name,
            course.description ?? "",
            course.subject ?? "",
            ...course.tags,
          ],
          category: course.subject,
          tags: course.tags,
        },
        query,
      ),
    )
    .filter((course) => !query.folderId || course.folderId === query.folderId)
    .filter((course) => query.status === "all" || course.status === query.status)
    .sort((a, b) => {
      if (query.sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (query.sort === "progress-desc") return b.progress - a.progress;
      if (query.sort === "progress-asc") return a.progress - b.progress;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

export function normalizeCourseQuery(query: { search?: string; semantic?: string; category?: string; tag?: string | string[]; status?: string; sort?: string; folder?: string }) {
  return {
    ...normalizeStandardSearchQuery(query),
    status: ["not-started", "in-progress", "completed"].includes(query.status ?? "") ? query.status! : "all",
    sort: ["name", "progress-desc", "progress-asc"].includes(query.sort ?? "") ? query.sort! : "created",
    folderId: query.folder?.trim() || undefined,
  };
}
