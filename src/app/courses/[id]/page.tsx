import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ListChecks } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateProgress, getNextLesson } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LessonChecklist } from "@/components/lesson-checklist";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { lessonNumber: "asc" },
        include: { studyNotes: { take: 1 } },
      },
    },
  });
  if (!course) notFound();

  const completed = course.lessons.filter((lesson) => lesson.completed).length;
  const progress = calculateProgress(completed, course.totalLessons);
  const nextLesson = getNextLesson(course.lessons);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Button variant="ghost" asChild className="-ml-3"><Link href="/"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></Button>
      <section className="rounded-2xl border bg-card p-6 shadow-soft md:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div><p className="mb-2 text-sm font-medium text-primary">CURSO</p><h1 className="text-3xl font-bold tracking-tight">{course.name}</h1><p className="mt-3 text-sm text-muted-foreground">{course.totalLessons} aulas • {completed} concluídas</p>{course.url && <Button asChild variant="outline" size="sm" className="mt-4"><a href={course.url} target="_blank" rel="noopener noreferrer">Abrir plataforma <ExternalLink className="h-4 w-4" /></a></Button>}</div><div className="min-w-52 rounded-xl bg-secondary/60 p-4"><p className="text-sm text-muted-foreground">Seu progresso</p><p className="mt-1 text-3xl font-bold text-primary">{progress}%</p><Progress value={progress} className="mt-3" /></div></div><div className="mt-6 rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary">{nextLesson ? `Você parou na aula ${nextLesson}` : "Curso concluído — parabéns!"}</div></section>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Checklist de aulas</CardTitle><CardDescription>Marque o progresso e abra cada aula para acessar o vídeo e o editor Markdown.</CardDescription></CardHeader><CardContent><LessonChecklist courseId={course.id} lessons={course.lessons.map((lesson) => { const note = lesson.studyNotes[0]; return { id: lesson.id, lessonNumber: lesson.lessonNumber, completed: lesson.completed, completedAt: lesson.completedAt?.toISOString() ?? null, studyNote: note ? { videoUrl: note.videoUrl, videoId: note.videoId, content: note.content, updatedAt: note.updatedAt.toISOString() } : undefined }; })} /></CardContent></Card>
    </div>
  );
}
