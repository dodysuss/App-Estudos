"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Cloud, Copy, ExternalLink, Loader2, Send, TriangleAlert } from "lucide-react";
import { publishDigitalAsset, updateDigitalAsset } from "@/actions/digital-asset-actions";
import { ASSET_COVER_COLORS, DEFAULT_ASSET_TYPE, DIGITAL_ASSET_TYPES, isDigitalAssetType } from "@/lib/digital-assets";
import { normalizeEditorHtml } from "@/lib/rich-html";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import { FolderSelect } from "@/components/folder-select";
import { DigitalAssetStages } from "@/components/digital-asset-stages";
import type { FolderOption } from "@/lib/folders";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type DigitalAssetEditorData = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  assetType: string;
  content: string | null;
  publishedContent: string | null;
  publishedAt: Date | null;
  coverImage: string | null;
  coverColor: string | null;
  folderId: string | null;
  stages: Array<{
    id: string;
    title: string;
    content: string | null;
    position: number;
  }>;
};

export function DigitalAssetEditor({ asset, folders = [] }: { asset: DigitalAssetEditorData; folders?: FolderOption[] }) {
  const [values, setValues] = useState({
    title: asset.title,
    description: asset.description ?? "",
    tags: asset.tags.join(", "),
    category: asset.category ?? "",
    assetType: isDigitalAssetType(asset.assetType) ? asset.assetType : DEFAULT_ASSET_TYPE,
    content: normalizeEditorHtml(asset.content),
    coverImage: asset.coverImage ?? "",
    coverColor: asset.coverColor ?? ASSET_COVER_COLORS[0],
    folderId: asset.folderId ?? "",
  });
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(Boolean(asset.publishedAt && asset.publishedContent));
  const [publishing, startPublishing] = useTransition();
  const initialized = useRef(false);
  const saveSequence = useRef(0);

  const coverStyle = values.coverImage
    ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,.08), rgba(15,23,42,.48)), url(${values.coverImage})` }
    : { background: values.coverColor || ASSET_COVER_COLORS[0] };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const sequence = saveSequence.current + 1;
    saveSequence.current = sequence;
    setStatus("saving");
    setMessage("");

    const timer = window.setTimeout(async () => {
      const result = await updateDigitalAsset({ assetId: asset.id, ...values });
      if (sequence !== saveSequence.current) return;

      if (result.success) {
        setStatus("saved");
        setMessage("Alterações salvas automaticamente.");
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [asset.id, values]);

  function updateField(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function publish() {
    setMessage("");
    startPublishing(async () => {
      const result = await publishDigitalAsset({ assetId: asset.id, ...values });
      if (!result.success) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setStatus("saved");
      setMessage("Publicado. A página HTML já está disponível.");
      setPublished(true);
    });
  }

  function copyInternalLink() {
    const url = `${window.location.origin}/assets/${asset.id}/published`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }

  const label =
    status === "saving"
      ? "Salvando..."
      : status === "saved"
        ? message || "Salvo"
        : status === "error"
          ? message
          : "Autosave ativo";
  const StatusIcon = status === "saving" ? Loader2 : status === "error" ? TriangleAlert : status === "saved" ? Check : Cloud;

  return (
    <div className="space-y-6">
      {/* Cover Header Editor */}
      <section className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
        <div className="min-h-56 bg-cover bg-center p-5 text-white md:p-8" style={coverStyle}>
          <div className="flex h-full min-h-40 flex-col justify-between gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-950 uppercase tracking-wider">
                {values.assetType}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {published && (
                  <Button asChild size="sm" variant="secondary" className="bg-white/95 text-slate-950 hover:bg-white rounded-xl">
                    <Link href={`/assets/${asset.id}/published`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Ver página
                    </Link>
                  </Button>
                )}
                <Button type="button" size="sm" variant="secondary" className="bg-white/95 text-slate-950 hover:bg-white rounded-xl" onClick={copyInternalLink}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copiado" : "Copiar link"}
                </Button>
                <Button type="button" size="sm" className="rounded-xl" onClick={publish} disabled={publishing || !values.content.trim()}>
                  {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                  Publicar
                </Button>
              </div>
            </div>

            <div>
              <Input
                value={values.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="h-auto border-0 bg-white/0 px-0 py-0 text-3xl font-extrabold tracking-tight text-white shadow-none placeholder:text-white/60 focus-visible:ring-0 md:text-5xl"
                placeholder="Título do ativo..."
                aria-label="Título do ativo"
              />
              <Textarea
                value={values.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="mt-3 min-h-12 max-w-2xl resize-none border-0 bg-white/0 px-0 py-0 text-sm leading-relaxed text-white/80 shadow-none placeholder:text-white/50 focus-visible:ring-0"
                placeholder="Adicione uma breve descrição para o card..."
                maxLength={240}
                aria-label="Descrição curta"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-background/50 px-4 py-2.5">
          <div className={cn("flex items-center gap-2 text-xs font-semibold", status === "error" ? "text-destructive" : "text-muted-foreground")}>
            <StatusIcon className={cn("h-3.5 w-3.5", status === "saving" && "animate-spin")} />
            <span>{label}</span>
          </div>
        </div>
      </section>

      {/* Editor & Metadata columns */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Editor Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual Editor */}
          <section className="rounded-2xl border bg-card/60 p-3 shadow-sm md:p-4">
            <div className="mb-3 px-1">
              <p className="eyebrow">Editor de Conteúdo</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">Anotações do Card</h2>
            </div>
            <RichTextEditor
              value={values.content}
              onChange={(value) => updateField("content", value)}
              placeholder="Escreva livremente. Use o menu de blocos para incluir checklists, códigos ou avisos..."
              minHeightClassName="min-h-[calc(100vh-28rem)]"
            />
          </section>

          {/* Execution Stages */}
          <DigitalAssetStages
            assetId={asset.id}
            initialStages={asset.stages.map((stage) => ({
              id: stage.id,
              title: stage.title,
              content: stage.content,
              position: stage.position,
            }))}
          />
        </div>

        {/* Sidebar Metadata config (Right) */}
        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card/60 p-5 shadow-sm space-y-4">
            <div>
              <p className="eyebrow">Configurações</p>
              <h2 className="mt-1 text-base font-bold text-foreground">Metadados do Ativo</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="asset-type" className="font-semibold text-muted-foreground">Tipo de Conteúdo</label>
                <select
                  id="asset-type"
                  value={values.assetType}
                  onChange={(event) => updateField("assetType", event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background/50 px-2.5 text-xs outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DIGITAL_ASSET_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="asset-category" className="font-semibold text-muted-foreground">Categoria</label>
                <Input id="asset-category" value={values.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Ex: Produto, IA, Dev" className="h-9 bg-background/50 text-xs rounded-lg" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="asset-folder" className="font-semibold text-muted-foreground">Pasta</label>
                <FolderSelect folders={folders} value={values.folderId} onChange={(value) => updateField("folderId", value)} />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="asset-tags" className="font-semibold text-muted-foreground">Tags</label>
                <Input id="asset-tags" value={values.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="vendas, prompt, design" className="h-9 bg-background/50 text-xs rounded-lg" />
                <p className="text-[10px] text-muted-foreground/60 leading-none">Separe por vírgulas.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card/60 p-5 shadow-sm space-y-4">
            <div>
              <p className="eyebrow">Aparência</p>
              <h2 className="mt-1 text-base font-bold text-foreground">Visual da Capa</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="asset-cover-image" className="font-semibold text-muted-foreground">URL da Imagem de Capa</label>
                <Input id="asset-cover-image" value={values.coverImage} onChange={(event) => updateField("coverImage", event.target.value)} placeholder="https://exemplo.com/imagem.png" className="h-9 bg-background/50 text-xs rounded-lg" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="asset-cover-color" className="font-semibold text-muted-foreground">Ou Cor Sólida</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Input id="asset-cover-color" type="color" value={values.coverColor || ASSET_COVER_COLORS[0]} onChange={(event) => updateField("coverColor", event.target.value)} className="w-10 h-8 p-0.5 rounded-lg bg-background/50 border shrink-0 cursor-pointer" />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {ASSET_COVER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateField("coverColor", color)}
                        className="h-6 w-6 rounded-md border transition hover:scale-110"
                        style={{ background: color }}
                        aria-label={`Usar cor ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
