"use client";

import { useActionState, useEffect, useState } from "react";
import { BookPlus, ListVideo, Loader2 } from "lucide-react";
import { createCourse, type CourseFormState } from "@/actions/course-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CourseKind = "COURSE" | "VIDEO_PLAYLIST";
type FieldName = "name" | "description" | "url" | "totalLessons" | "subject" | "tags";

const initialState: CourseFormState = {};

export function CourseForm({ kind = "COURSE" }: { kind?: CourseKind }) {
  const [state, action, pending] = useActionState(createCourse, initialState);
  const [values, setValues] = useState({ name: "", description: "", url: "", totalLessons: "", subject: "", tags: "" });
  const [editedFields, setEditedFields] = useState<Set<FieldName>>(new Set());
  const isPlaylist = kind === "VIDEO_PLAYLIST";

  useEffect(() => {
    setEditedFields(new Set());
  }, [state]);

  function updateField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setEditedFields((current) => new Set(current).add(name));
  }

  const fieldError = (name: FieldName) => editedFields.has(name) ? undefined : state.errors?.[name]?.[0];
  const submitLabel = pending
    ? isPlaylist ? "Importando vídeos..." : "Criando..."
    : isPlaylist ? "Importar playlist" : "Criar curso";

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="kind" value={kind} />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          {isPlaylist ? "Nome da playlist" : "Nome do curso"} <span className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          name="name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder={isPlaylist ? "Ex.: Front-end essencial" : "Ex.: TypeScript do zero ao avançado"}
          aria-invalid={!!fieldError("name")}
        />
        {fieldError("name") && <p className="text-sm text-destructive">{fieldError("name")}</p>}
      </div>

      {isPlaylist && (
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Descrição <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Textarea
            id="description"
            name="description"
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Ex.: Sequência de vídeos para revisar fundamentos, práticas e próximos passos."
            maxLength={500}
            aria-invalid={!!fieldError("description")}
          />
          {fieldError("description") && <p className="text-sm text-destructive">{fieldError("description")}</p>}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="url" className="text-sm font-medium">
          {isPlaylist ? "URL da playlist" : "URL do curso"}{" "}
          {isPlaylist ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(opcional)</span>}
        </label>
        <Input
          id="url"
          name="url"
          type="text"
          value={values.url}
          onChange={(event) => updateField("url", event.target.value)}
          placeholder={isPlaylist ? "youtube.com/playlist?list=..." : "plataforma.com/meu-curso"}
          aria-invalid={!!fieldError("url")}
        />
        {fieldError("url") && <p className="text-sm text-destructive">{fieldError("url")}</p>}
        {isPlaylist && (
          <p className="text-xs text-muted-foreground">
            Cole a URL pública de uma playlist do YouTube. Os vídeos serão importados automaticamente como embeds.
          </p>
        )}
      </div>

      {!isPlaylist && (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Assunto <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="subject"
                name="subject"
                value={values.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                placeholder="Ex.: Programação"
                aria-invalid={!!fieldError("subject")}
              />
              {fieldError("subject") && <p className="text-sm text-destructive">{fieldError("subject")}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="tags"
                name="tags"
                value={values.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="typescript, frontend, iniciante"
                aria-invalid={!!fieldError("tags")}
              />
              {fieldError("tags") && <p className="text-sm text-destructive">{fieldError("tags")}</p>}
              <p className="text-xs text-muted-foreground">Separe as tags com vírgulas.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="totalLessons" className="text-sm font-medium">
              Quantidade de aulas <span className="text-destructive">*</span>
            </label>
            <Input
              id="totalLessons"
              name="totalLessons"
              type="number"
              min={1}
              max={1000}
              value={values.totalLessons}
              onChange={(event) => updateField("totalLessons", event.target.value)}
              placeholder="24"
              aria-invalid={!!fieldError("totalLessons")}
            />
            {fieldError("totalLessons") && <p className="text-sm text-destructive">{fieldError("totalLessons")}</p>}
            <p className="text-xs text-muted-foreground">
              O checklist será criado automaticamente. Se houver um erro, os demais campos continuarão preenchidos.
            </p>
          </div>
        </>
      )}

      {state.message && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.message}</p>}

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlaylist ? <ListVideo className="h-4 w-4" /> : <BookPlus className="h-4 w-4" />}
        {submitLabel}
      </Button>
    </form>
  );
}
