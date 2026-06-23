"use client";

import { useActionState } from "react";
import { BookPlus, Loader2 } from "lucide-react";
import { createCourse, type CourseFormState } from "@/actions/course-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CourseFormState = {};

export function CourseForm() {
  const [state, action, pending] = useActionState(createCourse, initialState);
  const field = (name: "name" | "url" | "totalLessons") => state.errors?.[name]?.[0];
  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="space-y-2"><label htmlFor="name" className="text-sm font-medium">Nome do curso <span className="text-destructive">*</span></label><Input id="name" name="name" placeholder="Ex.: TypeScript do zero ao avançado" aria-invalid={!!field("name")} /><p className="text-sm text-destructive">{field("name")}</p></div>
      <div className="space-y-2"><label htmlFor="url" className="text-sm font-medium">URL do curso <span className="text-muted-foreground">(opcional)</span></label><Input id="url" name="url" type="url" placeholder="https://plataforma.com/meu-curso" aria-invalid={!!field("url")} /><p className="text-sm text-destructive">{field("url")}</p></div>
      <div className="space-y-2"><label htmlFor="totalLessons" className="text-sm font-medium">Quantidade de aulas <span className="text-destructive">*</span></label><Input id="totalLessons" name="totalLessons" type="number" min={1} max={1000} placeholder="24" aria-invalid={!!field("totalLessons")} /><p className="text-sm text-destructive">{field("totalLessons")}</p><p className="text-xs text-muted-foreground">O checklist será criado automaticamente.</p></div>
      {state.message && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.message}</p>}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookPlus className="h-4 w-4" />}{pending ? "Criando curso..." : "Criar curso"}</Button>
    </form>
  );
}
