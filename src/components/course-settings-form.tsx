"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateCourseDetails } from "@/actions/course-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CourseSettings = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  kind?: "COURSE" | "VIDEO_PLAYLIST";
  subject: string | null;
  tags: string[];
};

export function CourseSettingsForm({ course }: { course: CourseSettings }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    name: course.name,
    description: course.description ?? "",
    url: course.url ?? "",
    subject: course.subject ?? "",
    tags: course.tags.join(", "),
  });
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isPlaylist = course.kind === "VIDEO_PLAYLIST";

  function resetValues() {
    setValues({
      name: course.name,
      description: course.description ?? "",
      url: course.url ?? "",
      subject: course.subject ?? "",
      tags: course.tags.join(", "),
    });
  }

  function cancel() {
    resetValues();
    setError("");
    setEditing(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateCourseDetails({ courseId: course.id, ...values });
      if (!result.success) return setError(result.error);
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
        {isPlaylist ? "Editar playlist" : "Editar curso"}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border bg-background/70 p-4 sm:grid-cols-2" noValidate>
      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="edit-course-name" className="text-sm font-medium">
          {isPlaylist ? "Nome da playlist" : "Nome do curso"}
        </label>
        <Input
          id="edit-course-name"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          required
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="edit-course-description" className="text-sm font-medium">Descrição</label>
        <Textarea
          id="edit-course-description"
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder={isPlaylist ? "Descreva o objetivo desta playlist." : "Descrição opcional."}
          maxLength={500}
        />
      </div>

      {!isPlaylist && (
        <>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="edit-course-url" className="text-sm font-medium">Link do curso</label>
            <Input
              id="edit-course-url"
              value={values.url}
              onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))}
              placeholder="plataforma.com/curso"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-course-subject" className="text-sm font-medium">Assunto</label>
            <Input
              id="edit-course-subject"
              value={values.subject}
              onChange={(event) => setValues((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Ex.: Programação"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-course-tags" className="text-sm font-medium">Tags</label>
            <Input
              id="edit-course-tags"
              value={values.tags}
              onChange={(event) => setValues((current) => ({ ...current, tags: event.target.value }))}
              placeholder="typescript, frontend"
            />
            <p className="text-xs text-muted-foreground">Separe com vírgulas.</p>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={pending}>
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}
