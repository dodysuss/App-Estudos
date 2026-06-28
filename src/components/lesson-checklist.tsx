"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronDown, FolderOpen, GripVertical, NotebookPen, Pencil, Pin, Star } from "lucide-react";
import { reorderLessons, toggleLesson, toggleLessonPinned, updateLessonNotes, updateLessonRating, updateLessonTitle } from "@/actions/lesson-actions";
import { reorderCourseModules } from "@/actions/module-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NotesEditor } from "@/components/notes-editor";

type StudyNoteData = {
  videoUrl: string | null;
  videoId: string | null;
  content: string | null;
  publishedContent: string | null;
  publishedAt: string | null;
  publications: Array<{ id: string; content: string }>;
  updatedAt: string;
};

type LessonItem = {
  id: string;
  lessonNumber: number;
  position: number;
  title: string | null;
  notes: string | null;
  moduleId: string | null;
  completed: boolean;
  completedAt: string | null;
  rating: number;
  pinned: boolean;
  studyNote?: StudyNoteData;
};

type CourseModule = { id: string; name: string; position: number };
type DragItem = { type: "lesson" | "module"; id: string } | null;
type ItemLabel = "aula" | "vídeo";

function labelName(itemLabel: ItemLabel, number: number) {
  return `${itemLabel === "vídeo" ? "Vídeo" : "Aula"} ${number}`;
}

function EditableLessonTitle({ lesson, itemLabel, onSave }: { lesson: LessonItem; itemLabel: ItemLabel; onSave: (lessonId: string, title: string) => void }) {
  const [title, setTitle] = useState(lesson.title ?? "");
  const [editing, setEditing] = useState(false);
  useEffect(() => setTitle(lesson.title ?? ""), [lesson.title]);

  function save() {
    const trimmed = title.trim();
    if (trimmed !== (lesson.title ?? "")) onSave(lesson.id, trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={title}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
          if (event.key === "Escape") { setTitle(lesson.title ?? ""); setEditing(false); }
        }}
        placeholder={labelName(itemLabel, lesson.lessonNumber)}
        aria-label={`Nome ${itemLabel === "vídeo" ? "do vídeo" : "da aula"} ${lesson.lessonNumber}`}
        maxLength={120}
        className="h-9 max-w-xl"
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 px-2">
      <p className={`truncate font-semibold ${lesson.completed ? "text-muted-foreground line-through" : ""}`}>
        {lesson.title || labelName(itemLabel, lesson.lessonNumber)}
      </p>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); setEditing(true); }}
        className="rounded-lg p-1 text-muted-foreground opacity-70 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100"
        aria-label={`Editar nome ${itemLabel === "vídeo" ? "do vídeo" : "da aula"} ${lesson.lessonNumber}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EditableLessonDescription({ lesson, onSave }: { lesson: LessonItem; onSave: (lessonId: string, notes: string) => void }) {
  const [description, setDescription] = useState(lesson.notes ?? "");

  useEffect(() => setDescription(lesson.notes ?? ""), [lesson.notes]);

  function save() {
    const trimmed = description.trim();
    if (trimmed !== (lesson.notes ?? "")) onSave(lesson.id, trimmed);
  }

  return (
    <Textarea
      value={description}
      onChange={(event) => setDescription(event.target.value)}
      onBlur={save}
      placeholder="Adicionar descrição opcional..."
      maxLength={500}
      className="mx-auto mt-3 min-h-16 max-w-2xl resize-y border-dashed bg-background/70 text-center text-sm"
      aria-label="Descrição opcional do vídeo"
    />
  );
}

function LessonRating({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange(value === rating ? 0 : value);
          }}
          className="rounded-md p-0.5 text-amber-400 transition hover:scale-110 hover:bg-amber-400/10"
          aria-label={`${value} estrela${value === 1 ? "" : "s"}`}
          title={`${value} estrela${value === 1 ? "" : "s"}`}
        >
          <Star className={`h-4 w-4 ${value <= rating ? "fill-current" : ""}`} />
        </button>
      ))}
    </div>
  );
}

export function LessonChecklist({
  courseId,
  lessons: initialLessons,
  modules: initialModules = [],
  itemLabel = "aula",
  showVideo = true,
  allowModules = false,
}: {
  courseId: string;
  lessons: LessonItem[];
  modules?: CourseModule[];
  itemLabel?: ItemLabel;
  showVideo?: boolean;
  allowModules?: boolean;
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [modules, setModules] = useState(initialModules);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => new Set([...initialModules.map((courseModule) => courseModule.id), "unassigned"]));
  const [dragItem, setDragItem] = useState<DragItem>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isVideoList = itemLabel === "vídeo";
  const canDragLessons = allowModules || isVideoList;

  function sortLessons(items: LessonItem[]) {
    return [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.position - b.position || a.lessonNumber - b.lessonNumber);
  }

  useEffect(() => setLessons(initialLessons), [initialLessons]);
  useEffect(() => {
    setModules(initialModules);
    setExpandedModules((current) => new Set([...current, ...initialModules.map((courseModule) => courseModule.id)]));
  }, [initialModules]);

  function toggleModule(moduleId: string) {
    setExpandedModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  }

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

  function changeTitle(id: string, title: string) {
    const before = lessons;
    setError("");
    setLessons((items) => items.map((item) => item.id === id ? { ...item, title: title || null } : item));
    startTransition(async () => {
      const result = await updateLessonTitle({ lessonId: id, courseId, title });
      if (!result.success) { setLessons(before); setError(result.error); }
    });
  }

  function changeDescription(id: string, notes: string) {
    const before = lessons;
    setError("");
    setLessons((items) => items.map((item) => item.id === id ? { ...item, notes: notes || null } : item));
    startTransition(async () => {
      const result = await updateLessonNotes({ lessonId: id, courseId, notes });
      if (!result.success) { setLessons(before); setError(result.error); }
    });
  }

  function changeRating(id: string, rating: number) {
    const before = lessons;
    setError("");
    setLessons((items) => items.map((item) => item.id === id ? { ...item, rating } : item));
    startTransition(async () => {
      const result = await updateLessonRating({ lessonId: id, courseId, rating });
      if (!result.success) { setLessons(before); setError(result.error); }
    });
  }

  function changePinned(id: string, pinned: boolean) {
    const before = lessons;
    setError("");
    setLessons((items) => items.map((item) => item.id === id ? { ...item, pinned } : item));
    startTransition(async () => {
      const result = await toggleLessonPinned({ lessonId: id, courseId, pinned });
      if (!result.success) { setLessons(before); setError(result.error); }
    });
  }

  function normalizedLessonGroups(items: LessonItem[]) {
    const groups = new Map<string, LessonItem[]>();
    for (const lesson of sortLessons(items)) {
      const key = lesson.moduleId ?? "unassigned";
      groups.set(key, [...(groups.get(key) ?? []), lesson]);
    }
    return groups;
  }

  function moveLesson(lessonId: string, targetModuleId: string | null, beforeLessonId?: string) {
    const before = lessons;
    const draggedLesson = lessons.find((lesson) => lesson.id === lessonId);
    if (!draggedLesson || beforeLessonId === lessonId) return;

    const groups = normalizedLessonGroups(lessons);
    const sourceKey = draggedLesson.moduleId ?? "unassigned";
    const targetKey = targetModuleId ?? "unassigned";
    groups.set(sourceKey, (groups.get(sourceKey) ?? []).filter((lesson) => lesson.id !== lessonId));
    const targetLessons = [...(groups.get(targetKey) ?? [])];
    const targetIndex = beforeLessonId ? targetLessons.findIndex((lesson) => lesson.id === beforeLessonId) : -1;
    targetLessons.splice(targetIndex >= 0 ? targetIndex : targetLessons.length, 0, { ...draggedLesson, moduleId: targetModuleId });
    groups.set(targetKey, targetLessons);

    const updates = new Map<string, LessonItem>();
    for (const [key, groupedLessons] of groups) {
      groupedLessons.forEach((lesson, index) => updates.set(lesson.id, { ...lesson, moduleId: key === "unassigned" ? null : key, position: index + 1 }));
    }
    const next = lessons.map((lesson) => updates.get(lesson.id) ?? lesson);
    setLessons(next);
    setExpandedModules((current) => new Set(current).add(targetKey));
    setError("");
    startTransition(async () => {
      const result = await reorderLessons({ courseId, lessons: next.map(({ id, moduleId, position }) => ({ id, moduleId, position })) });
      if (!result.success) { setLessons(before); setError(result.error); }
    });
  }

  function moveModule(moduleId: string, beforeModuleId: string) {
    if (moduleId === beforeModuleId) return;
    const before = modules;
    const reordered = [...modules].sort((a, b) => a.position - b.position);
    const draggedModule = reordered.find((courseModule) => courseModule.id === moduleId);
    if (!draggedModule) return;
    const withoutDragged = reordered.filter((courseModule) => courseModule.id !== moduleId);
    const targetIndex = withoutDragged.findIndex((courseModule) => courseModule.id === beforeModuleId);
    withoutDragged.splice(targetIndex >= 0 ? targetIndex : withoutDragged.length, 0, draggedModule);
    const next = withoutDragged.map((courseModule, index) => ({ ...courseModule, position: index + 1 }));
    setModules(next);
    setError("");
    startTransition(async () => {
      const result = await reorderCourseModules({ courseId, moduleIds: next.map((courseModule) => courseModule.id) });
      if (!result.success) { setModules(before); setError(result.error); }
    });
  }

  const sortedModules = [...modules].sort((a, b) => a.position - b.position);
  const lessonGroups = normalizedLessonGroups(lessons);
  const sections = allowModules && modules.length
    ? [...sortedModules.map((courseModule) => ({ ...courseModule, lessons: lessonGroups.get(courseModule.id) ?? [] })), { id: "unassigned", name: "Sem módulo", position: Number.MAX_SAFE_INTEGER, lessons: lessonGroups.get("unassigned") ?? [] }]
    : [{ id: "all", name: "", position: 1, lessons: sortLessons(lessons) }];

  function renderLesson(lesson: LessonItem, moduleId: string | null) {
    const isExpanded = expandedLesson === lesson.id;
    const hasStudy = Boolean((showVideo && lesson.studyNote?.videoUrl) || lesson.studyNote?.content);
    return (
      <div
        key={lesson.id}
        onDragOver={(event) => { if (dragItem?.type === "lesson") event.preventDefault(); }}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (dragItem?.type === "lesson") moveLesson(dragItem.id, moduleId, lesson.id); setDragItem(null); }}
        className={`overflow-hidden rounded-2xl border transition ${lesson.completed ? "border-emerald-500/30 bg-emerald-500/10" : "bg-card/80 hover:border-primary/25"}`}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-controls={`study-${lesson.id}`}
          onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpandedLesson(isExpanded ? null : lesson.id); } }}
          className="group flex cursor-pointer items-center gap-2 p-3 transition hover:bg-accent/50 md:p-4"
        >
          {canDragLessons && (
            <button
              type="button"
              draggable={!pending}
              onClick={(event) => event.stopPropagation()}
              onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = "move"; setDragItem({ type: "lesson", id: lesson.id }); }}
              onDragEnd={() => setDragItem(null)}
              className="cursor-grab rounded-xl p-1 text-muted-foreground hover:bg-secondary active:cursor-grabbing"
              aria-label={`Arrastar ${isVideoList ? "vídeo" : "aula"} ${lesson.lessonNumber}`}
            >
              <GripVertical className="h-5 w-5" />
            </button>
          )}
          <span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <Checkbox checked={lesson.completed} onCheckedChange={(value) => changeCompleted(lesson.id, value === true)} aria-label={`Marcar ${itemLabel} ${lesson.lessonNumber} como ${lesson.completed ? "pendente" : "concluído"}`} />
          </span>
          {!isVideoList && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-muted-foreground">{lesson.lessonNumber}</span>}
          <div className="min-w-0 flex-1">
            <EditableLessonTitle lesson={lesson} itemLabel={itemLabel} onSave={changeTitle} />
            <div className="mt-1 flex flex-wrap items-center gap-2 px-2">
              {hasStudy && !isVideoList && <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"><NotebookPen className="h-3 w-3" />Com anotações</span>}
              {lesson.completedAt && <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CalendarCheck className="h-3.5 w-3.5" />Concluída em {new Intl.DateTimeFormat("pt-BR").format(new Date(lesson.completedAt))}</span>}
            </div>
          </div>
          {isVideoList && (
            <div className="flex shrink-0 items-center gap-2" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
              <LessonRating rating={lesson.rating} onChange={(rating) => changeRating(lesson.id, rating)} />
              <button
                type="button"
                onClick={() => changePinned(lesson.id, !lesson.pinned)}
                className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${lesson.pinned ? "border-primary/30 bg-primary/10 text-primary" : "bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                aria-pressed={lesson.pinned}
                aria-label={lesson.pinned ? "Desfixar vídeo" : "Fixar vídeo no início"}
                title={lesson.pinned ? "Desfixar vídeo" : "Fixar no início"}
              >
                <Pin className={`h-3.5 w-3.5 ${lesson.pinned ? "fill-current" : ""}`} />
              </button>
            </div>
          )}
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>
        {isExpanded && (
          <div id={`study-${lesson.id}`} className="border-t bg-background/60 p-4 md:p-6">
            <div className="mb-6 text-center">
              <p className="eyebrow justify-center">
                {showVideo ? "Vídeo" : `Aula ${lesson.lessonNumber}`}
              </p>
              <h3 className="mx-auto mt-2 max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
                {lesson.title || labelName(itemLabel, lesson.lessonNumber)}
              </h3>
              <EditableLessonDescription lesson={lesson} onSave={changeDescription} />
            </div>
            <NotesEditor courseId={courseId} lessonId={lesson.id} initial={lesson.studyNote} showVideo={showVideo} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy={pending}>
      {error && <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {allowModules && modules.length > 0 && <p className="rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">Arraste módulos e aulas pelas alças. Solte uma aula sobre outro módulo ou sobre outra aula para reorganizar.</p>}
      {sections.map((section) => {
        const isModuleSection = section.id !== "all";
        const isExpanded = !isModuleSection || expandedModules.has(section.id);
        const sectionModuleId = section.id === "unassigned" || section.id === "all" ? null : section.id;
        return (
          <section
            key={section.id}
            onDragOver={(event) => { if (isModuleSection && dragItem) event.preventDefault(); }}
            onDrop={(event) => {
              if (!isModuleSection) return;
              event.preventDefault();
              if (dragItem?.type === "lesson") moveLesson(dragItem.id, sectionModuleId);
              if (dragItem?.type === "module" && section.id !== "unassigned") moveModule(dragItem.id, section.id);
              setDragItem(null);
            }}
            className={isModuleSection ? "overflow-hidden rounded-3xl border bg-card/75" : "space-y-3"}
          >
            {isModuleSection && (
              <div className="flex items-center border-b bg-secondary/35">
                {section.id !== "unassigned" && (
                  <button
                    type="button"
                    draggable={!pending}
                    onClick={(event) => event.stopPropagation()}
                    onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = "move"; setDragItem({ type: "module", id: section.id }); }}
                    onDragEnd={() => setDragItem(null)}
                    className="ml-3 cursor-grab rounded-xl p-1 text-muted-foreground hover:bg-secondary active:cursor-grabbing"
                    aria-label={`Arrastar módulo ${section.name}`}
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                )}
                <button type="button" onClick={() => toggleModule(section.id)} className="flex min-w-0 flex-1 items-center gap-2 p-4 text-left">
                  <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-semibold">{section.name}</span>
                  <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">{section.lessons.length} aula{section.lessons.length === 1 ? "" : "s"}</span>
                  <ChevronDown className={`ml-auto h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
            {isExpanded && (
              <div className={isModuleSection ? "space-y-3 p-3" : "space-y-3"}>
                {section.lessons.length ? section.lessons.map((lesson) => renderLesson(lesson, sectionModuleId)) : <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Solte uma aula aqui.</div>}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
