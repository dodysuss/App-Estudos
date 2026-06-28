"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Download, FileText, FileUp, Loader2 } from "lucide-react";
import { uploadCourseMaterial, type MaterialUploadState } from "@/actions/material-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CourseMaterialItem = {
  id: string;
  fileName: string;
  size: number;
  url: string;
  createdAt: string;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB"];
  let value = size / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
      Enviar material
    </Button>
  );
}

export function CourseMaterials({ courseId, materials }: { courseId: string; materials: CourseMaterialItem[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<MaterialUploadState, FormData>(uploadCourseMaterial, {});

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <section className="surface-card p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="rounded-2xl bg-primary/10 p-2 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            Material didático
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Envie PDFs, apostilas, planilhas, slides ou qualquer arquivo de apoio para consultar durante o curso.
          </p>
        </div>

        <form ref={formRef} action={formAction} className="w-full space-y-2 lg:max-w-xl">
          <input type="hidden" name="courseId" value={courseId} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input name="material" type="file" className="cursor-pointer" aria-label="Arquivo de material didático" />
            <SubmitButton />
          </div>
          {state.message && (
            <p className={`text-xs ${state.success ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`} role="status">
              {state.message}
            </p>
          )}
        </form>
      </div>

      <div className="mt-5 grid gap-2">
        {materials.length ? (
          materials.map((material) => (
            <a
              key={material.id}
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-2 rounded-2xl border bg-background/70 p-3 transition hover:border-primary/40 hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="truncate font-semibold">{material.fileName}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {formatBytes(material.size)}
                <span>•</span>
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(material.createdAt))}
                <Download className="h-4 w-4" />
              </span>
            </a>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed bg-background/50 p-6 text-sm text-muted-foreground">
            Nenhum material didático enviado ainda.
          </div>
        )}
      </div>
    </section>
  );
}
