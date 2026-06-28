import Link from "next/link";
import { ListVideo, Plus } from "lucide-react";
import { filterDecoratedCourses, getDecoratedCourses, normalizeCourseQuery } from "@/lib/course-list";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";

type SearchParams = Promise<{ search?: string; status?: string; sort?: string; subject?: string | string[] }>;

export const metadata = { title: "Playlists de vídeos" };

export default async function PlaylistsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = normalizeCourseQuery(await searchParams);
  const playlists = filterDecoratedCourses(await getDecoratedCourses("VIDEO_PLAYLIST"), query);

  return (
    <div className="page-shell">
      <section className="hero-surface">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Biblioteca de vídeos</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Playlists</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Importe playlists públicas do YouTube, assista aos vídeos embutidos e registre anotações em Markdown.
            </p>
          </div>
          <Button asChild>
            <Link href="/playlists/new">
              <Plus className="h-4 w-4" />
              Importar playlist
            </Link>
          </Button>
        </div>
      </section>

      <CourseFilters search={query.search} status={query.status} sort={query.sort} itemLabel="playlist" clearHref="/playlists" />

      {playlists.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{playlists.map((playlist) => <CourseCard key={playlist.id} course={playlist} />)}</div>
      ) : (
        <section className="surface-card px-6 py-16 text-center">
          <ListVideo className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-bold tracking-tight">Nenhuma playlist encontrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">Importe uma playlist ou limpe os filtros de busca.</p>
          <Button asChild className="mt-6">
            <Link href="/playlists/new">Importar playlist</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
