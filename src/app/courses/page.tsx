import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { filterDecoratedCourses, getDecoratedCourses, normalizeCourseQuery } from "@/lib/course-list";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";

type SearchParams = Promise<{ search?: string; status?: string; sort?: string; subject?: string | string[] }>;

export const metadata = { title: "Cursos" };

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = normalizeCourseQuery(await searchParams);
  const allCourses = await getDecoratedCourses("COURSE");
  const courses = filterDecoratedCourses(allCourses, query);
  const subjects = [...new Set(allCourses.map((course) => course.subject).filter((subject): subject is string => Boolean(subject)))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <div className="page-shell">
      <section className="hero-surface">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Biblioteca</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Cursos</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Acompanhe cursos de qualquer plataforma, organize módulos, salve materiais e mantenha anotações por aula.
            </p>
          </div>
          <Button asChild>
            <Link href="/courses/new">
              <Plus className="h-4 w-4" />
              Novo curso
            </Link>
          </Button>
        </div>
      </section>

      <CourseFilters search={query.search} status={query.status} sort={query.sort} subjects={subjects} selectedSubjects={query.subjects} showSubjects clearHref="/courses" />

      {courses.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>
      ) : (
        <section className="surface-card px-6 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-bold tracking-tight">Nenhum curso encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">Cadastre um curso ou limpe os filtros de busca.</p>
          <Button asChild className="mt-6">
            <Link href="/courses/new">Criar primeiro curso</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
