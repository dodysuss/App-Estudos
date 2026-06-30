import Link from "next/link";
import { ArrowRight, BookOpen, Boxes, CheckCircle2, ListVideo, Plus, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { filterDecoratedCourses, getDecoratedCourses, normalizeCourseQuery } from "@/lib/course-list";
import { prisma } from "@/lib/prisma";
import { calculateProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard-stats";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";
import { uniqueSorted } from "@/lib/search-filters";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ search?: string; semantic?: string; category?: string; tag?: string | string[]; status?: string; sort?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const query = normalizeCourseQuery(await searchParams);
  const [courses, activeAssets] = await Promise.all([
    getDecoratedCourses(user.id),
    prisma.digitalAsset.count({ where: { userId: user.id, archived: false } }),
  ]);

  const regularCourses = courses.filter((course) => course.kind === "COURSE");
  const playlists = courses.filter((course) => course.kind === "VIDEO_PLAYLIST");
  const availableCategories = uniqueSorted(courses.map((course) => course.subject));
  const availableTags = uniqueSorted(courses.flatMap((course) => course.tags));
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);
  const progress = calculateProgress(completedLessons, totalLessons);
  const continuing = [...courses]
    .filter((course) => course.progress < 100)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);
  const filtered = filterDecoratedCourses(courses, query);

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
    {
      title: "Ativos Digitais",
      description: "Guarde prompts, hacks, códigos, links, checklists, ideias, documentos e referências em cards reutilizáveis.",
      count: activeAssets,
      href: "/assets",
      createHref: "/assets/new",
      createLabel: "Novo ativo",
      icon: Boxes,
      tone: "from-sky-500/20 via-cyan-500/10 to-transparent text-sky-500",
    },
  ];

  return (
    <div className="page-shell">
      <section className="hero-surface bg-gradient-to-br from-card/90 via-card/75 to-background/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 blur-3xl rounded-full" />
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Painel de estudos
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              Continue aprendendo sem perder onde parou.
            </h1>
            <p className="mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Cursos, playlists, ativos digitais, materiais e anotações em um painel único — desenhado para abrir, estudar e registrar progresso com pouco atrito.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild className="rounded-xl text-xs">
                <Link href="/courses/new">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Novo curso
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl bg-background/50 text-xs">
                <Link href="/playlists/new">
                  <ListVideo className="h-3.5 w-3.5 mr-1" />
                  Importar playlist
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl bg-background/50 text-xs">
                <Link href="/assets/new">
                  <Boxes className="h-3.5 w-3.5 mr-1" />
                  Novo ativo
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-background/50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </span>
              <span className="text-3xl font-extrabold tracking-tight text-foreground">{progress}%</span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Resumo do momento</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {completedLessons} itens concluídos, {totalLessons - completedLessons} pendentes e {activeAssets} ativos digitais.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Áreas de estudo">
        {menuCards.map(({ title, description, count, href, createHref, createLabel, icon: Icon, tone }) => (
          <Card key={title} className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-md">
            <CardContent className={cn("bg-gradient-to-br p-6 md:p-7 h-full flex flex-col justify-between", tone)}>
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-xl bg-background/80 p-2.5 shadow-sm border border-border/40">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-background/80 border border-border/40 px-2.5 py-0.5 text-3xs font-bold text-muted-foreground">{count} {count === 1 ? "item" : "itens"}</span>
                </div>
                <h2 className="mt-6 text-xl font-bold tracking-tight text-foreground">{title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-border/40">
                <Button asChild size="sm" className="rounded-lg text-xs">
                  <Link href={href}>
                    Abrir <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-lg bg-background/50 text-xs">
                  <Link href={createHref}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {createLabel}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <DashboardStats stats={{ courses: regularCourses.length, playlists: playlists.length, assets: activeAssets, lessons: totalLessons, completed: completedLessons, pending: totalLessons - completedLessons, progress }} />

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
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Cursos e playlists</h2>
              <p className="text-sm text-muted-foreground">Busque cursos e playlists em um só lugar.</p>
            </div>
            <CourseFilters
              search={query.search}
              semantic={query.semantic}
              category={query.category}
              tags={availableTags}
              selectedTags={query.tags}
              status={query.status}
              sort={query.sort}
              categories={availableCategories}
              itemLabel="item"
            />
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
            Comece cadastrando um curso, importando uma playlist ou criando um ativo digital.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/courses/new">Novo curso</Link></Button>
            <Button asChild variant="outline"><Link href="/playlists/new">Importar playlist</Link></Button>
            <Button asChild variant="outline"><Link href="/assets/new">Novo ativo</Link></Button>
          </div>
        </section>
      )}
    </div>
  );
}
