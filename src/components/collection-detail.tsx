import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenText, CheckCircle2, Layers3, ListChecks, PlaySquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProgress, getNextLesson } from "@/lib/progress";
import type { CourseKind } from "@/lib/course-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LessonChecklist } from "@/components/lesson-checklist";
import { CourseSettingsForm } from "@/components/course-settings-form";
import { CourseModuleManager } from "@/components/course-module-manager";
import { CourseMaterials } from "@/components/course-materials";
import { DeleteCollectionButton, RefreshPlaylistButton } from "@/components/collection-actions";

export async function CollectionDetail({ id, kind }: { id: string; kind: CourseKind }) {
  const user = await requireUser();
  const item = await prisma.course.findFirst({
    where: { id, kind, userId: user.id },
    include: {
      modules: { orderBy: { position: "asc" } },
      materials: { orderBy: { createdAt: "desc" } },
      lessons: {
        orderBy: [{ pinned: "desc" }, { position: "asc" }, { lessonNumber: "asc" }],
        include: {
          studyNotes: {
            take: 1,
            include: { publications: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
    },
  });
  if (!item) notFound();

  const isPlaylist = kind === "VIDEO_PLAYLIST";
  const singular = isPlaylist ? "vídeo" : "aula";
  const plural = isPlaylist ? "vídeos" : "aulas";
  const collectionName = isPlaylist ? "Playlist" : "Curso";
  const listHref = isPlaylist ? "/playlists" : "/courses";
  const completed = item.lessons.filter((lesson) => lesson.completed).length;
  const progress = calculateProgress(completed, item.totalLessons);
  const nextLesson = getNextLesson(item.lessons);
  const studyNotesCount = item.lessons.filter((lesson) => lesson.studyNotes.some((note) => note.content || note.videoUrl || note.publications.length > 0)).length;

  return (
    <div className="page-shell">
      <Button variant="ghost" asChild className="-ml-3">
        <Link href={listHref}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para {isPlaylist ? "playlists" : "cursos"}
        </Link>
      </Button>

      <section className="hero-surface">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{collectionName}</span>
              {progress === 100 && (
                <span className="pill border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Concluído
                </span>
              )}
            </div>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">{item.name}</h1>
            {item.description && <p className="mt-4 max-w-3xl text-base text-muted-foreground">{item.description}</p>}
            <p className="mt-4 text-sm text-muted-foreground">
              {item.totalLessons} {plural} • {completed} concluídos • {studyNotesCount} com anotações
            </p>

            {(item.subject || item.tags.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.subject && <span className="pill border-primary/20 bg-primary/10 text-primary">{item.subject}</span>}
                {item.tags.map((tag) => (
                  <span key={tag} className="pill">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-start gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href={`/notes?collection=${item.id}`}>
                  <BookOpenText className="h-4 w-4" />
                  Anotações e publicações
                </Link>
              </Button>
              {!isPlaylist && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/courses/${item.id}/notes`}>
                    <BookOpenText className="h-4 w-4" />
                    Anotações do curso
                  </Link>
                </Button>
              )}
              <CourseSettingsForm
                course={{
                  id: item.id,
                  kind: isPlaylist ? "VIDEO_PLAYLIST" : "COURSE",
                  name: item.name,
                  description: item.description,
                  url: item.url,
                  subject: item.subject,
                  tags: item.tags,
                }}
              />
              {isPlaylist && <RefreshPlaylistButton courseId={item.id} />}
              <DeleteCollectionButton courseId={item.id} kind={isPlaylist ? "VIDEO_PLAYLIST" : "COURSE"} name={item.name} />
            </div>
          </div>

          <aside className="rounded-3xl border bg-background/70 p-5">
            <p className="text-sm font-medium text-muted-foreground">Seu progresso</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-5xl font-bold tracking-tight text-primary">{progress}%</p>
              <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                {isPlaylist ? <PlaySquare className="h-6 w-6" /> : <Layers3 className="h-6 w-6" />}
              </span>
            </div>
            <Progress value={progress} className="mt-5" />
            <div className="mt-5 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
              {nextLesson ? `Você parou ${isPlaylist ? "no vídeo" : "na aula"} ${nextLesson}` : `${collectionName} concluído — parabéns!`}
            </div>
          </aside>
        </div>
      </section>

      {!isPlaylist && (
        <CourseMaterials
          courseId={item.id}
          materials={item.materials.map((material) => ({
            id: material.id,
            fileName: material.fileName,
            size: material.size,
            url: material.url,
            createdAt: material.createdAt.toISOString(),
          }))}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ListChecks className="h-6 w-6 text-primary" />
            {isPlaylist ? "PLAYLIST" : "Plano de estudo"}
          </CardTitle>
          <CardDescription>
            {isPlaylist
              ? "Abra um vídeo, assista no player e registre anotações em Markdown no mesmo fluxo."
              : "Organize módulos, renomeie aulas, acompanhe progresso e registre anotações por aula."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!isPlaylist && <CourseModuleManager courseId={item.id} moduleCount={item.modules.length} />}
          <LessonChecklist
            courseId={item.id}
            itemLabel={singular}
            showVideo={isPlaylist}
            allowModules={!isPlaylist}
            modules={item.modules.map((courseModule) => ({ id: courseModule.id, name: courseModule.name, position: courseModule.position }))}
            lessons={item.lessons.map((lesson) => {
              const note = lesson.studyNotes[0];
              return {
                id: lesson.id,
                lessonNumber: lesson.lessonNumber,
                position: lesson.position,
                title: lesson.title,
                notes: lesson.notes,
                moduleId: lesson.moduleId,
                completed: lesson.completed,
                completedAt: lesson.completedAt?.toISOString() ?? null,
                rating: lesson.rating,
                pinned: lesson.pinned,
                studyNote: note
                  ? {
                      videoUrl: note.videoUrl,
                      videoId: note.videoId,
                      content: note.content,
                      publishedContent: note.publishedContent,
                      publishedAt: note.publishedAt?.toISOString() ?? null,
                      publications: note.publications.map((publication) => ({
                        id: publication.id,
                        content: publication.content,
                      })),
                      updatedAt: note.updatedAt.toISOString(),
                    }
                  : undefined,
              };
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
