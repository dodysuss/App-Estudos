"use client";

import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, GripVertical, Layers3, Loader2, Plus, Trash2, TriangleAlert } from "lucide-react";
import {
  createDigitalAssetStage,
  deleteDigitalAssetStage,
  reorderDigitalAssetStages,
  updateDigitalAssetStage,
} from "@/actions/digital-asset-actions";
import { normalizeEditorHtml } from "@/lib/rich-html";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor";

type StageData = {
  id: string;
  title: string;
  content: string | null;
  position: number;
};

type StageSaveStatus = "idle" | "saving" | "saved" | "error";

function StageEditor({
  assetId,
  stage,
  expanded,
  onToggle,
  onDelete,
}: {
  assetId: string;
  stage: StageData;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (stageId: string) => void;
}) {
  const [title, setTitle] = useState(stage.title);
  const [content, setContent] = useState(normalizeEditorHtml(stage.content));
  const [status, setStatus] = useState<StageSaveStatus>("idle");
  const [message, setMessage] = useState("");
  const initialized = useRef(false);
  const saveSequence = useRef(0);

  useEffect(() => {
    setTitle(stage.title);
    setContent(normalizeEditorHtml(stage.content));
    initialized.current = false;
  }, [stage.content, stage.title]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    if (!title.trim()) {
      setStatus("error");
      setMessage("Informe o nome da etapa.");
      return;
    }

    const sequence = saveSequence.current + 1;
    saveSequence.current = sequence;
    setStatus("saving");
    setMessage("");

    const timer = window.setTimeout(async () => {
      const result = await updateDigitalAssetStage({ assetId, stageId: stage.id, title, content });
      if (sequence !== saveSequence.current) return;

      if (result.success) {
        setStatus("saved");
        setMessage("Salvo automaticamente.");
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [assetId, content, stage.id, title]);

  const StatusIcon = status === "saving" ? Loader2 : status === "error" ? TriangleAlert : Check;
  const label = status === "saving" ? "Salvando..." : status === "error" ? message : status === "saved" ? message : "Autosave ativo";

  return (
    <article className="overflow-hidden rounded-3xl border bg-background/70">
      <div className="flex items-center gap-2 border-b bg-secondary/30 p-3">
        <span className="cursor-grab rounded-xl p-1 text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </span>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Layers3 className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-semibold">{title || "Etapa sem nome"}</span>
          <ChevronDown className={`ml-auto h-5 w-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(stage.id)} title="Apagar etapa">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label htmlFor={`stage-title-${stage.id}`} className="text-sm font-medium">Nome da etapa</label>
            <Input id={`stage-title-${stage.id}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} />
          </div>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Descreva esta etapa, adicione checklist, links, código, documentos ou referências."
            minHeightClassName="min-h-80"
          />
          <div className={`flex items-center gap-2 text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            <StatusIcon className={`h-3.5 w-3.5 ${status === "saving" ? "animate-spin" : ""}`} />
            <span>{label}</span>
          </div>
        </div>
      )}
    </article>
  );
}

export function DigitalAssetStages({ assetId, initialStages }: { assetId: string; initialStages: StageData[] }) {
  const [stages, setStages] = useState(initialStages);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(initialStages[0]?.id ?? null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setStages(initialStages);
    setExpandedStageId((current) => current ?? initialStages[0]?.id ?? null);
  }, [initialStages]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createDigitalAssetStage({ assetId, title: name });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setName("");
      if (result.id) setExpandedStageId(result.id);
      router.refresh();
    });
  }

  function remove(stageId: string) {
    const stage = stages.find((item) => item.id === stageId);
    const confirmed = window.confirm(`Apagar a etapa "${stage?.title ?? "sem nome"}"?`);
    if (!confirmed) return;

    const before = stages;
    setStages((current) => current.filter((item) => item.id !== stageId));
    setError("");
    startTransition(async () => {
      const result = await deleteDigitalAssetStage({ assetId, stageId });
      if (!result.success) {
        setStages(before);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function move(stageId: string, direction: -1 | 1) {
    const index = stages.findIndex((stage) => stage.id === stageId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= stages.length) return;

    const before = stages;
    const next = [...stages];
    const [stage] = next.splice(index, 1);
    next.splice(targetIndex, 0, stage);
    setStages(next.map((item, position) => ({ ...item, position: position + 1 })));
    setError("");
    startTransition(async () => {
      const result = await reorderDigitalAssetStages({ assetId, stageIds: next.map((item) => item.id) });
      if (!result.success) {
        setStages(before);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border bg-card/80 p-5 shadow-soft md:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Etapas do ativo</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Organização por etapas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {stages.length ? `${stages.length} etapa${stages.length === 1 ? "" : "s"} criada${stages.length === 1 ? "" : "s"}.` : "Crie etapas para dividir este ativo em partes menores."}
          </p>
        </div>
        <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Pesquisa inicial" maxLength={100} aria-label="Nome da nova etapa" />
          <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar etapa
          </Button>
        </form>
      </div>

      {error && <p className="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.id} className="space-y-2">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(stage.id, -1)} disabled={pending || index === 0}>
                Subir
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => move(stage.id, 1)} disabled={pending || index === stages.length - 1}>
                Descer
              </Button>
            </div>
            <StageEditor
              assetId={assetId}
              stage={stage}
              expanded={expandedStageId === stage.id}
              onToggle={() => setExpandedStageId((current) => current === stage.id ? null : stage.id)}
              onDelete={remove}
            />
          </div>
        ))}
        {!stages.length && (
          <div className="rounded-3xl border border-dashed bg-background/50 p-8 text-center text-sm text-muted-foreground">
            Nenhuma etapa criada ainda. Use o campo acima para adicionar a primeira.
          </div>
        )}
      </div>
    </section>
  );
}
