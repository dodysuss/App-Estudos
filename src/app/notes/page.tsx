import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpenText, ExternalLink, NotebookPen, Search, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { matchesStandardFilters, normalizeStandardSearchQuery, uniqueSorted } from "@/lib/search-filters";

type SearchParams = Promise<{ search?: string; semantic?: string; category?: string; tag?: string | string[] }>;

export const metadata = { title: "Anotações" };

export default async function NotesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = normalizeStandardSearchQuery(params);

  const [collections, notes] = await Promise.all([
    prisma.course.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, kind: true, subject: true, tags: true },
      orderBy: { name: "asc" },
    }),
    prisma.studyNote.findMany({
      where: { course: { is: { userId: user.id } } },
      include: {
        course: { select: { id: true, name: true, kind: true, subject: true, tags: true } },
        lesson: { select: { lessonNumber: true, title: true, notes: true } },
        publications: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const categories = uniqueSorted(collections.map((collection) => collection.subject));
  const tags = uniqueSorted(collections.flatMap((collection) => collection.tags));

  const filteredNotes = notes
    .map((note) => ({
      ...note,
      detailHref: note.course.kind === "VIDEO_PLAYLIST" ? `/playlists/${note.course.id}` : `/courses/${note.course.id}`,
      lessonTitle: note.lesson?.title || (note.lesson ? `${note.course.kind === "VIDEO_PLAYLIST" ? "Vídeo" : "Aula"} ${note.lesson.lessonNumber}` : "Anotação"),
    }))
    .filter((note) =>
      matchesStandardFilters(
        {
          text: [
            note.course.name,
            note.course.subject ?? "",
            ...note.course.tags,
            note.lessonTitle,
            note.lesson?.notes,
            note.content,
            ...note.publications.map((publication) => publication.content),
          ],
          category: note.course.subject,
          tags: note.course.tags,
        },
        query,
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
              Busque dentro das suas anotações, publicações e anotações curtas de aulas e vídeos.
            </p>
          </div>
          <div className="rounded-3xl border bg-background/70 px-5 py-4">
            <p className="text-3xl font-bold text-primary">{filteredNotes.length}</p>
            <p className="text-sm text-muted-foreground">itens encontrados</p>
          </div>
        </div>
      </section>

      <form method="get" className="surface-card p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">Refinar anotações</h2>
          <p className="text-xs text-muted-foreground">Busca textual, busca semântica, categoria e tags.</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input name="search" defaultValue={params.search ?? ""} placeholder="Busca textual dentro das anotações..." className="pl-10" />
          </label>

          <label className="relative">
            <Sparkles className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input name="semantic" defaultValue={params.semantic ?? ""} placeholder="Busca semântica: ideia, dúvida, objetivo ou tema relacionado..." className="pl-10" />
          </label>

          <select name="category" defaultValue={query.category} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select name="tag" defaultValue={query.tags[0] ?? ""} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Todas as tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex gap-2">
          <Button type="submit" className="flex-1 lg:flex-none">Procurar</Button>
          <Button asChild variant="outline" className="flex-1 lg:flex-none">
            <Link href="/notes">Limpar</Link>
          </Button>
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
                      {note.course.subject && <span>• {note.course.subject}</span>}
                      {note.course.tags.map((tag) => <span key={tag}>• #{tag}</span>)}
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
