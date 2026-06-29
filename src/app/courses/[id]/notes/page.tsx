import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpenText, NotebookPen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CourseNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const course = await prisma.course.findFirst({
    where: { id, kind: "COURSE", userId: user.id },
    include: {
      modules: { orderBy: { position: "asc" } },
      lessons: {
        orderBy: [{ position: "asc" }, { lessonNumber: "asc" }],
        include: { studyNotes: { take: 1 } },
      },
    },
  });

  if (!course) notFound();

  const moduleNames = new Map(course.modules.map((courseModule) => [courseModule.id, courseModule.name]));
  const lessonsWithNotes = course.lessons
    .map((lesson) => {
      const studyNote = lesson.studyNotes[0];
      return {
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        title: lesson.title || `Aula ${lesson.lessonNumber}`,
        moduleName: lesson.moduleId ? moduleNames.get(lesson.moduleId) : null,
        shortNote: lesson.notes,
        content: studyNote?.content,
        updatedAt: studyNote?.updatedAt ?? lesson.updatedAt,
      };
    })
    .filter((lesson) => Boolean(lesson.shortNote?.trim() || lesson.content?.trim()));

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Button variant="ghost" asChild className="-ml-3">
        <Link href={`/courses/${course.id}`}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para o curso
        </Link>
      </Button>

      <section className="rounded-2xl border bg-card p-6 shadow-soft md:p-8">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <BookOpenText className="h-4 w-4" />
          ANOTAÇÕES DO CURSO
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Todas as anotações salvas nas aulas deste curso em um só lugar.
        </p>
      </section>

      {lessonsWithNotes.length ? (
        <div className="space-y-4">
          {lessonsWithNotes.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                  <NotebookPen className="h-5 w-5 text-primary" />
                  {lesson.title}
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-2">
                  <span>Aula {lesson.lessonNumber}</span>
                  {lesson.moduleName && <span>• {lesson.moduleName}</span>}
                  <span>
                    • Atualizada em{" "}
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(lesson.updatedAt)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lesson.shortNote && (
                  <div className="rounded-xl bg-secondary/60 p-4 text-sm">
                    <p className="mb-1 font-medium">Anotação curta</p>
                    <p className="text-muted-foreground">{lesson.shortNote}</p>
                  </div>
                )}
                {lesson.content && (
                  <div className="markdown-preview rounded-xl border bg-background p-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}
                    >
                      {lesson.content}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Este curso ainda não tem anotações salvas nas aulas.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
