import { prisma } from "@/lib/prisma";
import { calculateProgress, getNextLesson, getProgressStatus } from "@/lib/progress";

export type CourseKind = "COURSE" | "VIDEO_PLAYLIST";

export type DecoratedCourse = {
  id: string;
  name: string;
  description: string | null;
  kind: CourseKind;
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

export async function getDecoratedCourses(kind?: CourseKind): Promise<DecoratedCourse[]> {
  const courses = await prisma.course.findMany({
    where: kind ? { kind } : undefined,
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
  query: { search: string; status: string; sort: string; subjects: string[] },
) {
  const search = query.search.toLocaleLowerCase("pt-BR");
  return [...courses]
    .filter((course) => {
      if (!search) return true;
      return [
        course.name,
        course.description ?? "",
        course.subject ?? "",
        ...course.tags,
      ].some((value) => value.toLocaleLowerCase("pt-BR").includes(search));
    })
    .filter((course) => query.status === "all" || course.status === query.status)
    .filter((course) => query.subjects.length === 0 || (course.subject && query.subjects.includes(course.subject)))
    .sort((a, b) => {
      if (query.sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (query.sort === "progress-desc") return b.progress - a.progress;
      if (query.sort === "progress-asc") return a.progress - b.progress;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

export function normalizeCourseQuery(query: { search?: string; status?: string; sort?: string; subject?: string | string[] }) {
  const subjects = (Array.isArray(query.subject) ? query.subject : query.subject ? [query.subject] : []).map((subject) => subject.trim()).filter(Boolean);
  return {
    search: query.search?.trim() ?? "",
    status: ["not-started", "in-progress", "completed"].includes(query.status ?? "") ? query.status! : "all",
    sort: ["name", "progress-desc", "progress-asc"].includes(query.sort ?? "") ? query.sort! : "created",
    subjects,
  };
}
