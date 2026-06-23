"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronDown, NotebookPen } from "lucide-react";
import { toggleLesson } from "@/actions/lesson-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { NotesEditor } from "@/components/notes-editor";

type StudyNoteData = {
  videoUrl: string | null;
  videoId: string | null;
  content: string | null;
  updatedAt: string;
};

type LessonItem = {
  id: string;
  lessonNumber: number;
  completed: boolean;
  completedAt: string | null;
  studyNote?: StudyNoteData;
};

export function LessonChecklist({ courseId, lessons: initialLessons }: { courseId: string; lessons: LessonItem[] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function changeCompleted(id: string, completed: boolean) {
    const before = lessons;
    setError("");
    setLessons((items) => items.map((item) => item.id === id ? { ...item, completed, completedAt: completed ? new Date().toISOString() : null } : item));
    startTransition(async () => {
      const result = await toggleLesson({ lessonId: id, courseId, completed });
      if (!result.success) { setLessons(before); setError(result.error); }
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3" aria-busy={pending}>
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {lessons.map((lesson) => {
        const isExpanded = expanded === lesson.id;
        const hasStudy = Boolean(lesson.studyNote?.videoUrl || lesson.studyNote?.content);
        return (
          <div key={lesson.id} className={`overflow-hidden rounded-xl border transition ${lesson.completed ? "border-emerald-500/30 bg-emerald-500/5" : "bg-card"}`}>
            <div className="flex items-center gap-3 p-4">
              <Checkbox checked={lesson.completed} onCheckedChange={(value) => changeCompleted(lesson.id, value === true)} aria-label={`Marcar aula ${lesson.lessonNumber} como ${lesson.completed ? "pendente" : "concluída"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className={`font-medium ${lesson.completed ? "text-muted-foreground line-through" : ""}`}>Aula {lesson.lessonNumber}</p>
                  {hasStudy && <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"><NotebookPen className="h-3 w-3" />Com anotações</span>}
                  {lesson.completedAt && <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CalendarCheck className="h-3.5 w-3.5" />Concluída em {new Intl.DateTimeFormat("pt-BR").format(new Date(lesson.completedAt))}</span>}
                </div>
              </div>
              <button type="button" onClick={() => setExpanded(isExpanded ? null : lesson.id)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10" aria-expanded={isExpanded} aria-controls={`study-${lesson.id}`}>
                {isExpanded ? "Fechar" : "Estudar"}<ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>
            {isExpanded && (
              <div id={`study-${lesson.id}`} className="border-t bg-background/70 p-4 md:p-6">
                <div className="mb-5"><h3 className="flex items-center gap-2 font-semibold"><NotebookPen className="h-5 w-5 text-primary" />Área de estudo — Aula {lesson.lessonNumber}</h3><p className="mt-1 text-sm text-muted-foreground">Assista ao vídeo e escreva suas anotações em Markdown.</p></div>
                <NotesEditor courseId={courseId} lessonId={lesson.id} initial={lesson.studyNote} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
