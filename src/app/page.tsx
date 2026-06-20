import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateProgress, getNextLesson, getProgressStatus } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard-stats";
import { CourseCard, type CourseCardData } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";

type SearchParams = Promise<{ search?: string; status?: string; sort?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const search = query.search?.trim() ?? "";
  const status = ["not-started", "in-progress", "completed"].includes(query.status ?? "") ? query.status! : "all";
  const sort = ["name", "progress-desc", "progress-asc"].includes(query.sort ?? "") ? query.sort! : "created";

  const courses = await prisma.course.findMany({ include: { lessons: { select: { lessonNumber: true, completed: true } } }, orderBy: { createdAt: "desc" } });
  const decorated = courses.map((course) => {
    const completedLessons = course.lessons.filter((lesson) => lesson.completed).length;
    return {
      id: course.id,
      name: course.name,
      totalLessons: course.totalLessons,
      completedLessons,
      progress: calculateProgress(completedLessons, course.totalLessons),
      nextLesson: getNextLesson(course.lessons),
      status: getProgressStatus(completedLessons, course.totalLessons),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  });

  const totalLessons = decorated.reduce((sum, course) => sum + course.totalLessons, 0);
  const completedLessons = decorated.reduce((sum, course) => sum + course.completedLessons, 0);
  const overallProgress = calculateProgress(completedLessons, totalLessons);
  const recent = decorated.slice(0, 3);
  const continuing = [...decorated].filter((course) => course.progress < 100).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 3);
  const filtered = decorated
    .filter((course) => course.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
    .filter((course) => status === "all" || course.status === status)
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "progress-desc") return b.progress - a.progress;
      if (sort === "progress-asc") return a.progress - b.progress;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return (
    <div className="mx-auto max-w-7xl space-y-9">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-sm font-medium text-primary">PAINEL DE ESTUDOS</p><h1 className="text-3xl font-bold tracking-tight">Olá, vamos continuar?</h1><p className="mt-2 text-muted-foreground">Acompanhe seu avanço e retome de onde parou.</p></div><Button asChild><Link href="/courses/new"><Plus className="h-4 w-4" />Novo curso</Link></Button></section>
      <DashboardStats stats={{ courses: courses.length, lessons: totalLessons, completed: completedLessons, pending: totalLessons - completedLessons, progress: overallProgress }} />

      {courses.length === 0 ? (
        <section className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center"><span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><BookOpen className="h-7 w-7" /></span><h2 className="text-xl font-semibold">Seu primeiro curso começa aqui</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Cadastre um curso e receba um checklist completo para acompanhar cada aula.</p><Button asChild className="mt-6"><Link href="/courses/new"><Plus className="h-4 w-4" />Cadastrar curso</Link></Button></section>
      ) : (
        <>
          <section><div className="mb-4"><h2 className="text-xl font-semibold">Continuar estudando</h2><p className="text-sm text-muted-foreground">Seus cursos incompletos, atualizados recentemente.</p></div>{continuing.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{continuing.map((course) => <CourseCard key={course.id} course={course} compact />)}</div> : <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Tudo concluído. Belo trabalho!</p>}</section>
          <section><div className="mb-4"><h2 className="text-xl font-semibold">Cursos recentes</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recent.map((course) => <CourseCard key={course.id} course={course} compact />)}</div></section>
          <section className="space-y-4"><div><h2 className="text-xl font-semibold">Todos os cursos</h2><p className="text-sm text-muted-foreground">Busque, filtre e ordene sua biblioteca.</p></div><CourseFilters search={search} status={status} sort={sort} />{filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((course) => <CourseCard key={course.id} course={course as CourseCardData} />)}</div> : <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum curso corresponde aos filtros.</p>}</section>
        </>
      )}
    </div>
  );
}
