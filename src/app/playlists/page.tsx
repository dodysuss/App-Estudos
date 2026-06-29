import Link from "next/link";
import { ListVideo, Plus } from "lucide-react";
import { filterDecoratedCourses, getDecoratedCourses, normalizeCourseQuery } from "@/lib/course-list";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";
import { FolderCreateForm } from "@/components/folder-create-form";
import { buildFolderOptions } from "@/lib/folders";

type SearchParams = Promise<{ search?: string; status?: string; sort?: string; subject?: string | string[]; folder?: string }>;

export const metadata = { title: "Playlists de vídeos" };

export default async function PlaylistsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const query = normalizeCourseQuery(await searchParams);
  const playlists = filterDecoratedCourses(await getDecoratedCourses(user.id, "VIDEO_PLAYLIST"), query);
  const folders = await prisma.folder.findMany({
    where: { userId: user.id, scope: "VIDEO_PLAYLIST" },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });
  const folderOptions = buildFolderOptions(folders);

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

      <CourseFilters search={query.search} status={query.status} sort={query.sort} itemLabel="playlist" clearHref="/playlists" folderId={query.folderId} />

      <section className="space-y-3">
        <FolderCreateForm scope="VIDEO_PLAYLIST" folders={folders} />
        {folderOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={!query.folderId ? "secondary" : "outline"} size="sm"><Link href="/playlists">Todas as pastas</Link></Button>
            {folderOptions.map((folder) => (
              <Button key={folder.id} asChild variant={query.folderId === folder.id ? "secondary" : "outline"} size="sm">
                <Link href={`/playlists?folder=${folder.id}`}>{folder.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </section>

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
