import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpenText, ExternalLink, NotebookPen, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<{ search?: string; collection?: string }>;

function normalizeSearch(value?: string) {
  return value?.trim().toLocaleLowerCase("pt-BR") ?? "";
}

function includesSearch(values: Array<string | null | undefined>, search: string) {
  if (!search) return true;
  return values.some((value) => value?.toLocaleLowerCase("pt-BR").includes(search));
}

export const metadata = { title: "Anotações" };

export default async function NotesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const search = normalizeSearch(params.search);
  const collectionId = params.collection?.trim() || "";

  const [collections, notes] = await Promise.all([
    prisma.course.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, kind: true },
      orderBy: { name: "asc" },
    }),
    prisma.studyNote.findMany({
      where: { course: { is: { userId: user.id } }, ...(collectionId ? { courseId: collectionId } : {}) },
      include: {
        course: { select: { id: true, name: true, kind: true } },
        lesson: { select: { lessonNumber: true, title: true, notes: true } },
        publications: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const filteredNotes = notes
    .map((note) => ({
      ...note,
      detailHref: note.course.kind === "VIDEO_PLAYLIST" ? `/playlists/${note.course.id}` : `/courses/${note.course.id}`,
      lessonTitle: note.lesson?.title || (note.lesson ? `${note.course.kind === "VIDEO_PLAYLIST" ? "Vídeo" : "Aula"} ${note.lesson.lessonNumber}` : "Anotação"),
    }))
    .filter((note) =>
      includesSearch(
        [
          note.course.name,
          note.lessonTitle,
          note.lesson?.notes,
          note.content,
          ...note.publications.map((publication) => publication.content),
        ],
        search,
      ),
    )
    .filter((note) => Boolean(note.content?.trim() || note.lesson?.notes?.trim() || note.publications.length));

  return (
    <div className="page-shell">
      <section className="hero-surface">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Central de conhecimento</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Todas as anotações e publicações</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Busque dentro das suas anotações em Markdown, publicações e anotações curtas de aulas e vídeos.
            </p>
          </div>
          <div className="rounded-3xl border bg-background/70 px-5 py-4">
            <p className="text-3xl font-bold text-primary">{filteredNotes.length}</p>
            <p className="text-sm text-muted-foreground">itens encontrados</p>
          </div>
        </div>
      </section>

      <form method="get" className="surface-card p-4 md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
          <label className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input name="search" defaultValue={params.search ?? ""} placeholder="Buscar dentro das anotações..." className="pl-10" />
          </label>

          <select name="collection" defaultValue={collectionId} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Todos os cursos e playlists</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.kind === "VIDEO_PLAYLIST" ? "Playlist" : "Curso"} — {collection.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 lg:flex-none">
              Procurar
            </Button>
            <Button asChild variant="outline" className="flex-1 lg:flex-none">
              <Link href="/notes">Limpar</Link>
            </Button>
          </div>
        </div>
      </form>

      {filteredNotes.length ? (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                      <NotebookPen className="h-5 w-5 text-primary" />
                      {note.lessonTitle}
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap gap-2">
                      <span>{note.course.kind === "VIDEO_PLAYLIST" ? "Playlist" : "Curso"}: {note.course.name}</span>
                      {note.lesson && <span>• Item {note.lesson.lessonNumber}</span>}
                      {note.publications.length > 0 && <span>• {note.publications.length} publicação(ões)</span>}
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={note.detailHref}>
                      Abrir
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.lesson?.notes && (
                  <section className="rounded-2xl bg-secondary/60 p-4 text-sm">
                    <p className="mb-1 font-semibold">Anotação curta</p>
                    <p className="text-muted-foreground">{note.lesson.notes}</p>
                  </section>
                )}

                {note.content && (
                  <section className="rounded-2xl border bg-background/70 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <BookOpenText className="h-4 w-4 text-primary" />
                      Rascunho salvo
                    </p>
                    <div className="markdown-preview text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>
                        {note.content}
                      </ReactMarkdown>
                    </div>
                  </section>
                )}

                {note.publications.map((publication) => (
                  <section key={publication.id} className="rounded-2xl border bg-card/70 p-4">
                    <p className="mb-3 text-sm font-semibold">Publicação</p>
                    <div className="markdown-preview text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>
                        {publication.content}
                      </ReactMarkdown>
                    </div>
                  </section>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <NotebookPen className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Nenhuma anotação encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tente outro termo de busca ou limpe os filtros.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
