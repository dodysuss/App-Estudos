"use client";

import { useActionState, useEffect, useState } from "react";
import { Archive, ImageIcon, Loader2, Plus } from "lucide-react";
import { createDigitalAsset, type DigitalAssetFormState, type DigitalAssetFormValues } from "@/actions/digital-asset-actions";
import { ASSET_COVER_COLORS, DEFAULT_ASSET_TYPE, DIGITAL_ASSET_TYPES } from "@/lib/digital-assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import { FolderSelect } from "@/components/folder-select";
import type { FolderOption } from "@/lib/folders";

const initialState: DigitalAssetFormState = {};

const emptyValues: DigitalAssetFormValues = {
  title: "",
  description: "",
  tags: "",
  category: "",
  assetType: DEFAULT_ASSET_TYPE,
  content: "",
  coverImage: "",
  coverColor: ASSET_COVER_COLORS[0],
  folderId: "",
};

export function DigitalAssetForm({ folders = [] }: { folders?: FolderOption[] }) {
  const [state, action, pending] = useActionState(createDigitalAsset, initialState);
  const [values, setValues] = useState<DigitalAssetFormValues>(emptyValues);

  useEffect(() => {
    if (state.values) setValues(state.values);
  }, [state.values]);

  function updateField(name: keyof DigitalAssetFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  const fieldError = (name: keyof DigitalAssetFormValues) => state.errors?.[name]?.[0];
  const coverStyle = values.coverImage
    ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,.12), rgba(15,23,42,.45)), url(${values.coverImage})` }
    : { background: values.coverColor || ASSET_COVER_COLORS[0] };

  return (
    <form action={action} className="space-y-6" noValidate>
      {/* Cover Header Area */}
      <div className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
        <div className="min-h-56 bg-cover bg-center p-6 text-white md:p-8 flex flex-col justify-between gap-6" style={coverStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-950 uppercase tracking-wider">
              {values.assetType}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-2xs font-semibold backdrop-blur">
              Criação de Card
            </span>
          </div>

          <div>
            <Input
              id="title"
              name="title"
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="h-auto border-0 bg-white/0 px-0 py-0 text-3xl font-extrabold tracking-tight text-white shadow-none placeholder:text-white/60 focus-visible:ring-0 md:text-5xl"
              placeholder="Digite o título do novo card..."
              aria-label="Título do ativo"
            />
            {fieldError("title") && <p className="mt-1 text-xs text-rose-300 font-semibold">{fieldError("title")}</p>}

            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="mt-3 min-h-12 max-w-2xl resize-none border-0 bg-white/0 px-0 py-0 text-sm leading-relaxed text-white/80 shadow-none placeholder:text-white/50 focus-visible:ring-0"
              placeholder="Explique resumidamente para que este ativo serve..."
              maxLength={240}
              aria-label="Descrição curta"
            />
            {fieldError("description") && <p className="mt-1 text-xs text-rose-300 font-semibold">{fieldError("description")}</p>}
          </div>
        </div>
      </div>

      <input type="hidden" name="content" value={values.content} />

      {/* Editor & Metadata columns */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Editor Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border bg-card/60 p-3 shadow-sm md:p-4">
            <div className="mb-3 px-1">
              <p className="eyebrow">Editor de Conteúdo</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">Anotações do Card</h2>
            </div>
            <RichTextEditor
              value={values.content}
              onChange={(value) => updateField("content", value)}
              placeholder="Escreva livremente. Use o menu de blocos para incluir checklists, códigos ou avisos..."
              minHeightClassName="min-h-[calc(100vh-27rem)]"
            />
            {fieldError("content") && <p className="mt-3 text-xs text-destructive font-semibold">{fieldError("content")}</p>}
          </section>

          {state.message && <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-semibold">{state.message}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending} className="rounded-xl px-5">
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Criar card
            </Button>
            <p className="flex items-center gap-1.5 text-3xs text-muted-foreground/60 font-medium">
              <Archive className="h-3.5 w-3.5" />
              Depois de criado, o card poderá ser fixado, duplicado, arquivado, favoritado ou excluído.
            </p>
          </div>
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
                <label htmlFor="assetType" className="font-semibold text-muted-foreground">Tipo de Conteúdo</label>
                <select
                  id="assetType"
                  name="assetType"
                  value={values.assetType}
                  onChange={(event) => updateField("assetType", event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background/50 px-2.5 text-xs outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DIGITAL_ASSET_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {fieldError("assetType") && <p className="text-xs text-destructive">{fieldError("assetType")}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="font-semibold text-muted-foreground">Categoria</label>
                <Input id="category" name="category" value={values.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Ex: Produto, IA, Dev" className="h-9 bg-background/50 text-xs rounded-lg" />
                {fieldError("category") && <p className="text-xs text-destructive">{fieldError("category")}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="folderId" className="font-semibold text-muted-foreground">Pasta</label>
                <FolderSelect folders={folders} value={values.folderId} onChange={(value) => updateField("folderId", value)} />
                {fieldError("folderId") && <p className="text-xs text-destructive">{fieldError("folderId")}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tags" className="font-semibold text-muted-foreground">Tags</label>
                <Input id="tags" name="tags" value={values.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="vendas, prompt, design" className="h-9 bg-background/50 text-xs rounded-lg" />
                <p className="text-[10px] text-muted-foreground/60 leading-none">Separe por vírgulas.</p>
                {fieldError("tags") && <p className="text-xs text-destructive">{fieldError("tags")}</p>}
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
                <label htmlFor="coverImage" className="font-semibold text-muted-foreground">URL da Imagem de Capa</label>
                <Input id="coverImage" name="coverImage" value={values.coverImage} onChange={(event) => updateField("coverImage", event.target.value)} placeholder="https://exemplo.com/imagem.png" className="h-9 bg-background/50 text-xs rounded-lg" />
                {fieldError("coverImage") && <p className="text-xs text-destructive">{fieldError("coverImage")}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="coverColor" className="font-semibold text-muted-foreground">Ou Cor Sólida</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Input id="coverColor" name="coverColor" type="color" value={values.coverColor || ASSET_COVER_COLORS[0]} onChange={(event) => updateField("coverColor", event.target.value)} className="w-10 h-8 p-0.5 rounded-lg bg-background/50 border shrink-0 cursor-pointer" />
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
                {fieldError("coverColor") && <p className="text-xs text-destructive">{fieldError("coverColor")}</p>}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
