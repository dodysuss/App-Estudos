import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { filterDecoratedCourses, getDecoratedCourses, normalizeCourseQuery } from "@/lib/course-list";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";
import { FolderCreateForm } from "@/components/folder-create-form";
import { buildFolderOptions } from "@/lib/folders";

type SearchParams = Promise<{ search?: string; status?: string; sort?: string; subject?: string | string[]; folder?: string }>;

export const metadata = { title: "Cursos" };

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const query = normalizeCourseQuery(await searchParams);
  const allCourses = await getDecoratedCourses(user.id, "COURSE");
  const courses = filterDecoratedCourses(allCourses, query);
  const folders = await prisma.folder.findMany({
    where: { userId: user.id, scope: "COURSE" },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });
  const folderOptions = buildFolderOptions(folders);
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

      <CourseFilters search={query.search} status={query.status} sort={query.sort} subjects={subjects} selectedSubjects={query.subjects} showSubjects clearHref="/courses" folderId={query.folderId} />

      <section className="space-y-3">
        <FolderCreateForm scope="COURSE" folders={folders} />
        {folderOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={!query.folderId ? "secondary" : "outline"} size="sm"><Link href="/courses">Todas as pastas</Link></Button>
            {folderOptions.map((folder) => (
              <Button key={folder.id} asChild variant={query.folderId === folder.id ? "secondary" : "outline"} size="sm">
                <Link href={`/courses?folder=${folder.id}`}>{folder.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </section>

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
