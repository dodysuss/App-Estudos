"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Loader2 } from "lucide-react";
import { createCourseModule } from "@/actions/module-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CourseModuleManager({ courseId, moduleCount }: { courseId: string; moduleCount: number }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createCourseModule({ courseId, name });
      if (!result.success) return setError(result.error);
      setName("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-3xl border bg-secondary/25 p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="rounded-2xl bg-primary/10 p-2 text-primary">
          <FolderPlus className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold">Módulos do curso</h3>
          <p className="text-sm text-muted-foreground">
            {moduleCount ? `${moduleCount} módulo${moduleCount === 1 ? "" : "s"} criado${moduleCount === 1 ? "" : "s"}.` : "Crie módulos e distribua as aulas abaixo."}
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Fundamentos" maxLength={80} aria-label="Nome do novo módulo" />
        <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
          Adicionar módulo
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
