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
      <section className="overflow-hidden rounded-[2rem] border bg-card/80 shadow-soft">
        <div className="min-h-60 bg-cover bg-center p-5 text-white md:p-8" style={coverStyle}>
          <div className="flex h-full min-h-48 flex-col justify-between gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-950">{values.assetType}</span>
              <div className="flex flex-wrap gap-2">
                {published && (
                  <Button asChild size="sm" variant="secondary" className="bg-white/90 text-slate-950 hover:bg-white">
                    <Link href={`/assets/${asset.id}/published`}>
                      <ExternalLink className="h-4 w-4" />
                      Ver página
                    </Link>
                  </Button>
                )}
                <Button type="button" size="sm" variant="secondary" className="bg-white/90 text-slate-950 hover:bg-white" onClick={copyInternalLink}>
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar link"}
                </Button>
                <Button type="button" size="sm" onClick={publish} disabled={publishing || !values.content.trim()}>
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publicar
                </Button>
              </div>
            </div>

            <div>
              <Input
                value={values.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="h-auto border-0 bg-white/0 px-0 py-0 text-4xl font-bold tracking-tight text-white shadow-none placeholder:text-white/70 focus-visible:ring-0 md:text-6xl"
                placeholder="Título do ativo"
                aria-label="Título do ativo"
              />
              <Textarea
                value={values.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="mt-4 min-h-14 max-w-3xl resize-none border-0 bg-white/0 px-0 py-0 text-base leading-7 text-white/85 shadow-none placeholder:text-white/60 focus-visible:ring-0"
                placeholder="Descrição curta opcional..."
                maxLength={240}
                aria-label="Descrição curta"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-background/75 px-4 py-3 md:px-6">
          <div className={`flex items-center gap-2 text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            <StatusIcon className={`h-4 w-4 ${status === "saving" ? "animate-spin" : ""}`} />
            <span>{label}</span>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border bg-card/80 p-5 shadow-soft md:p-6">
        <div className="mb-5">
          <p className="eyebrow">Cadastro do card</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Informações do ativo digital</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="asset-type" className="text-sm font-medium">Tipo</label>
            <select
              id="asset-type"
              value={values.assetType}
              onChange={(event) => updateField("assetType", event.target.value)}
              className="h-11 w-full rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DIGITAL_ASSET_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="asset-category" className="text-sm font-medium">Categoria</label>
            <Input id="asset-category" value={values.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Ex.: IA, Marketing, Produto" />
          </div>

          <div className="space-y-2">
            <label htmlFor="asset-folder" className="text-sm font-medium">Pasta</label>
            <FolderSelect folders={folders} value={values.folderId} onChange={(value) => updateField("folderId", value)} />
          </div>

          <div className="space-y-2 xl:col-span-1">
            <label htmlFor="asset-tags" className="text-sm font-medium">Tags</label>
            <Input id="asset-tags" value={values.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="prompt, vendas, automação" />
            <p className="text-xs text-muted-foreground">Separe com vírgulas.</p>
          </div>

          <div className="space-y-2 md:col-span-1 xl:col-span-2">
            <label htmlFor="asset-cover-image" className="text-sm font-medium">URL de imagem da capa</label>
            <Input id="asset-cover-image" value={values.coverImage} onChange={(event) => updateField("coverImage", event.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-2 md:col-span-1 xl:col-span-2">
            <label htmlFor="asset-cover-color" className="text-sm font-medium">Cor da capa</label>
            <div className="flex flex-wrap items-center gap-2">
              <Input id="asset-cover-color" type="color" value={values.coverColor || ASSET_COVER_COLORS[0]} onChange={(event) => updateField("coverColor", event.target.value)} className="w-20 p-1" />
              {ASSET_COVER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateField("coverColor", color)}
                  className="h-9 w-9 rounded-xl border transition hover:scale-105"
                  style={{ background: color }}
                  aria-label={`Usar cor ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <DigitalAssetStages
        assetId={asset.id}
        initialStages={asset.stages.map((stage) => ({
          id: stage.id,
          title: stage.title,
          content: stage.content,
          position: stage.position,
        }))}
      />

      <section className="rounded-[2rem] border bg-card/80 p-3 shadow-soft md:p-4">
        <div className="mb-3 px-1">
          <p className="eyebrow">Editor visual</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Conteúdo do card</h2>
        </div>
        <RichTextEditor
          value={values.content}
          onChange={(value) => updateField("content", value)}
          placeholder="Escreva e formate livremente. Use o botão “Inserir conteúdo” para checklist, código copiável, segredo, tabela, destaque, link, documento e imagem."
          minHeightClassName="min-h-[calc(100vh-25rem)]"
        />
      </section>
    </div>
  );
}
