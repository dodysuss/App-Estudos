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
      <div className="overflow-hidden rounded-[2rem] border bg-card/80 shadow-soft">
        <div className="grid min-h-56 place-items-center bg-cover bg-center p-6 text-center text-white" style={coverStyle}>
          {!values.coverImage && (
            <div className="rounded-3xl bg-black/20 px-5 py-4 backdrop-blur-sm">
              <ImageIcon className="mx-auto h-8 w-8" />
              <p className="mt-2 text-sm font-semibold">Capa por cor ou imagem</p>
            </div>
          )}
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 md:col-span-2 xl:col-span-4">
            <label htmlFor="title" className="text-sm font-medium">
              Nome/título <span className="text-destructive">*</span>
            </label>
            <Input id="title" name="title" value={values.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ex.: Prompt mestre de prospecção" />
            {fieldError("title") && <p className="text-sm text-destructive">{fieldError("title")}</p>}
          </div>

          <div className="space-y-2 md:col-span-2 xl:col-span-4">
            <label htmlFor="description" className="text-sm font-medium">
              Descrição curta <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Explique em uma frase para que este ativo serve."
              maxLength={240}
            />
            {fieldError("description") && <p className="text-sm text-destructive">{fieldError("description")}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="assetType" className="text-sm font-medium">Tipo</label>
            <select
              id="assetType"
              name="assetType"
              value={values.assetType}
              onChange={(event) => updateField("assetType", event.target.value)}
              className="h-11 w-full rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DIGITAL_ASSET_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {fieldError("assetType") && <p className="text-sm text-destructive">{fieldError("assetType")}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="folderId" className="text-sm font-medium">
              Pasta <span className="text-muted-foreground">(opcional)</span>
            </label>
            <FolderSelect folders={folders} value={values.folderId} onChange={(value) => updateField("folderId", value)} />
            {fieldError("folderId") && <p className="text-sm text-destructive">{fieldError("folderId")}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">Categoria</label>
            <Input id="category" name="category" value={values.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Ex.: Marketing, Produto, IA" />
            {fieldError("category") && <p className="text-sm text-destructive">{fieldError("category")}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="tags" className="text-sm font-medium">Tags</label>
            <Input id="tags" name="tags" value={values.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="prompt, vendas, automação" />
            <p className="text-xs text-muted-foreground">Separe as tags com vírgulas.</p>
            {fieldError("tags") && <p className="text-sm text-destructive">{fieldError("tags")}</p>}
          </div>

          <div className="space-y-2 md:col-span-1 xl:col-span-2">
            <label htmlFor="coverImage" className="text-sm font-medium">URL de imagem da capa</label>
            <Input id="coverImage" name="coverImage" value={values.coverImage} onChange={(event) => updateField("coverImage", event.target.value)} placeholder="https://..." />
            {fieldError("coverImage") && <p className="text-sm text-destructive">{fieldError("coverImage")}</p>}
          </div>

          <div className="space-y-2 md:col-span-1 xl:col-span-2">
            <label htmlFor="coverColor" className="text-sm font-medium">Cor da capa</label>
            <div className="flex flex-wrap gap-2">
              <Input id="coverColor" name="coverColor" type="color" value={values.coverColor || ASSET_COVER_COLORS[0]} onChange={(event) => updateField("coverColor", event.target.value)} className="w-20 p-1" />
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
            {fieldError("coverColor") && <p className="text-sm text-destructive">{fieldError("coverColor")}</p>}
          </div>
        </div>
      </div>

      <input type="hidden" name="content" value={values.content} />

      <section className="rounded-[2rem] border bg-card/80 p-3 shadow-soft md:p-4">
        <div className="mb-3 px-1">
          <p className="eyebrow">Editor visual</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Conteúdo do card</h2>
        </div>
        <RichTextEditor
          value={values.content}
          onChange={(value) => updateField("content", value)}
          placeholder="Escreva e formate livremente. Use “Inserir conteúdo” para checklist, código copiável, segredo, tabela, destaque, link, documento e imagem."
          minHeightClassName="min-h-[calc(100vh-27rem)]"
        />
        {fieldError("content") && <p className="mt-3 text-sm text-destructive">{fieldError("content")}</p>}
      </section>

      {state.message && <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Criar ativo digital
        </Button>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Archive className="h-3.5 w-3.5" />
          Depois de criado, o card poderá ser fixado, duplicado, arquivado, favoritado ou excluído.
        </p>
      </div>
    </form>
  );
}
