import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ListVideo, Plus, Sparkles } from "lucide-react";
import { calculateProgress } from "@/lib/progress";
import { filterDecoratedCourses, getDecoratedCourses, normalizeCourseQuery } from "@/lib/course-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard-stats";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";

type SearchParams = Promise<{ search?: string; status?: string; sort?: string; subject?: string | string[] }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const query = normalizeCourseQuery(await searchParams);
  const courses = await getDecoratedCourses();
  const regularCourses = courses.filter((course) => course.kind === "COURSE");
  const playlists = courses.filter((course) => course.kind === "VIDEO_PLAYLIST");
  const availableSubjects = [...new Set(regularCourses.map((course) => course.subject).filter((subject): subject is string => Boolean(subject)))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);
  const continuing = [...courses]
    .filter((course) => course.progress < 100)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);
  const filtered = filterDecoratedCourses(courses, query);
  const progress = calculateProgress(completedLessons, totalLessons);

  const menuCards = [
    {
      title: "Cursos",
      description: "Acompanhe cursos de plataformas, mentorias, livros, trilhas ou aulas presenciais.",
      count: regularCourses.length,
      href: "/courses",
      createHref: "/courses/new",
      createLabel: "Novo curso",
      icon: BookOpen,
      tone: "from-primary/20 via-sky-400/10 to-transparent text-primary",
    },
    {
      title: "Playlists de vídeos",
      description: "Importe uma lista do YouTube, assista com embed e mantenha anotações por vídeo.",
      count: playlists.length,
      href: "/playlists",
      createHref: "/playlists/new",
      createLabel: "Importar playlist",
      icon: ListVideo,
      tone: "from-fuchsia-500/20 via-violet-500/10 to-transparent text-fuchsia-500",
    },
  ];

  return (
    <div className="page-shell">
      <section className="hero-surface">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <p className="eyebrow">Painel de estudos</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
              Continue aprendendo sem perder onde parou.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Cursos, playlists, módulos, materiais e anotações em um painel único — desenhado para abrir, estudar e registrar progresso com pouco atrito.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/courses/new">
                  <Plus className="h-4 w-4" />
                  Novo curso
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/playlists/new">
                  <ListVideo className="h-4 w-4" />
                  Importar playlist
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border bg-background/70 p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-6 w-6" />
              </span>
              <span className="text-4xl font-bold tracking-tight">{progress}%</span>
            </div>
            <p className="mt-5 text-sm font-semibold">Resumo do momento</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {completedLessons} itens concluídos, {totalLessons - completedLessons} pendentes.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Áreas de estudo">
        {menuCards.map(({ title, description, count, href, createHref, createLabel, icon: Icon, tone }) => (
          <Card key={title} className="group overflow-hidden transition hover:-translate-y-1 hover:border-primary/30">
            <CardContent className={`bg-gradient-to-br p-6 md:p-7 ${tone}`}>
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-3xl bg-background/80 p-3 shadow-sm">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="pill bg-background/80 text-foreground">{count} {count === 1 ? "item" : "itens"}</span>
              </div>
              <h2 className="mt-8 text-2xl font-bold tracking-tight text-foreground">{title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={href}>
                    Abrir <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={createHref}>
                    <Plus className="h-4 w-4" />
                    {createLabel}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <DashboardStats stats={{ courses: regularCourses.length, playlists: playlists.length, lessons: totalLessons, completed: completedLessons, pending: totalLessons - completedLessons, progress }} />

      {courses.length > 0 ? (
        <>
          <section>
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Retomar</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Continuar estudando</h2>
                <p className="text-sm text-muted-foreground">Itens incompletos atualizados recentemente.</p>
              </div>
            </div>
            {continuing.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{continuing.map((course) => <CourseCard key={course.id} course={course} compact />)}</div>
            ) : (
              <div className="surface-card p-8 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
                <h3 className="mt-3 font-semibold">Tudo concluído. Belo trabalho!</h3>
                <p className="mt-1 text-sm text-muted-foreground">Crie um novo estudo quando quiser começar outra trilha.</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <p className="eyebrow">Biblioteca</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Todos os estudos</h2>
              <p className="text-sm text-muted-foreground">Busque cursos e playlists em um só lugar.</p>
            </div>
            <CourseFilters search={query.search} status={query.status} sort={query.sort} subjects={availableSubjects} selectedSubjects={query.subjects} showSubjects itemLabel="item" />
            {filtered.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((course) => <CourseCard key={course.id} course={course} />)}</div>
            ) : (
              <p className="surface-card p-8 text-center text-sm text-muted-foreground">Nenhum item corresponde aos filtros.</p>
            )}
          </section>
        </>
      ) : (
        <section className="surface-card p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-bold tracking-tight">Sua biblioteca ainda está vazia</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Comece cadastrando um curso ou importando uma playlist pública do YouTube.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/courses/new">Novo curso</Link></Button>
            <Button asChild variant="outline"><Link href="/playlists/new">Importar playlist</Link></Button>
          </div>
        </section>
      )}
    </div>
  );
}
