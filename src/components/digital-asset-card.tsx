"use client";

import Link from "next/link";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BookOpenCheck,
  Bookmark,
  Boxes,
  Code,
  Copy,
  ExternalLink,
  FileText,
  Files,
  FolderKanban,
  Heart,
  Image,
  Lightbulb,
  MoreHorizontal,
  Pencil,
  Pin,
  RotateCcw,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import {
  deleteDigitalAsset,
  duplicateDigitalAsset,
  toggleDigitalAssetArchived,
  toggleDigitalAssetFavorite,
  toggleDigitalAssetPinned,
} from "@/actions/digital-asset-actions";
import { ASSET_COVER_COLORS } from "@/lib/digital-assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Map types to corresponding icons
const typeIconMap: Record<string, typeof Terminal> = {
  Nota: FileText,
  Hack: Zap,
  Prompt: Terminal,
  Código: Code,
  Link: ExternalLink,
  Documento: Bookmark,
  Imagem: Image,
  Checklist: BookOpenCheck,
  Ideia: Lightbulb,
  "Ativo digital": Boxes,
  Projeto: FolderKanban,
  Referência: Bookmark,
};

export type DigitalAssetCardData = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  assetType: string;
  coverImage: string | null;
  coverColor: string | null;
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  updatedAt: Date;
};

export function DigitalAssetCard({ asset, view = "grid" }: { asset: DigitalAssetCardData; view?: "grid" | "list" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const editorHref = `/assets/${asset.id}`;
  const publishedHref = `/assets/${asset.id}/published`;
  const TypeIcon = typeIconMap[asset.assetType] || FileText;

  const coverStyle = asset.coverImage
    ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.1), rgba(15,23,42,0.5)), url(${asset.coverImage})` }
    : { background: asset.coverColor || ASSET_COVER_COLORS[0] };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  function run(action: () => Promise<{ success: true; id?: string } | { success: false; error: string }>, after?: (id?: string) => void) {
    setError("");
    setShowMenu(false);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error);
        return;
      }
      after?.(result.id);
      router.refresh();
    });
  }

  function copyInternalLink() {
    const url = `${window.location.origin}${publishedHref}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setShowMenu(false);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }

  function remove() {
    const confirmed = window.confirm(`Excluir o ativo digital "${asset.title}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    run(() => deleteDigitalAsset({ assetId: asset.id }));
  }

  // Row / List layout render
  if (view === "list") {
    return (
      <Card
        className={cn(
          "group relative flex items-center justify-between p-3.5 border bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-300 gap-4 rounded-xl",
          asset.archived && "opacity-75 hover:opacity-100",
          asset.pinned && "ring-1 ring-primary/20"
        )}
      >
        <Link
          href={publishedHref}
          className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-cover bg-center"
          style={coverStyle}
        >
          <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <TypeIcon className="h-4 w-4 text-white drop-shadow" />
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={publishedHref} className="hover:text-primary transition duration-200">
              <h3 className="text-sm font-bold text-foreground truncate max-w-[280px] sm:max-w-[420px]">
                {asset.title}
              </h3>
            </Link>
            {asset.category && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary tracking-wide">
                {asset.category}
              </span>
            )}
            {asset.archived && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                Arquivado
              </span>
            )}
            {asset.pinned && <Pin className="h-3 w-3 fill-current text-primary shrink-0" />}
            {asset.favorite && <Heart className="h-3 w-3 fill-current text-rose-500 shrink-0" />}
          </div>
          {asset.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[320px] sm:max-w-[600px]">
              {asset.description}
            </p>
          )}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {asset.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[9px] text-muted-foreground/80">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            asChild
          >
            <Link href={editorHref} aria-label="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>

          <div className="relative" ref={menuRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>

            {showMenu && (
              <div className="absolute bottom-full right-0 z-30 mb-2 w-44 rounded-xl border bg-card/95 backdrop-blur-md p-1 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  type="button"
                  onClick={() => run(() => toggleDigitalAssetFavorite({ assetId: asset.id, value: !asset.favorite }))}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <Heart className={cn("h-3.5 w-3.5", asset.favorite && "fill-current text-rose-500")} />
                  {asset.favorite ? "Desfavoritar" : "Favoritar"}
                </button>

                <button
                  type="button"
                  onClick={() => run(() => toggleDigitalAssetPinned({ assetId: asset.id, value: !asset.pinned }))}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <Pin className={cn("h-3.5 w-3.5", asset.pinned && "fill-current text-primary")} />
                  {asset.pinned ? "Desfixar" : "Fixar"}
                </button>

                <button
                  type="button"
                  onClick={() => run(() => duplicateDigitalAsset({ assetId: asset.id }), (id) => id && router.push(`/assets/${id}`))}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <Files className="h-3.5 w-3.5" />
                  Duplicar card
                </button>

                <button
                  type="button"
                  onClick={() => run(() => toggleDigitalAssetArchived({ assetId: asset.id, value: !asset.archived }))}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  {asset.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  {asset.archived ? "Restaurar card" : "Arquivar card"}
                </button>

                <button
                  type="button"
                  onClick={copyInternalLink}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar link
                </button>

                <hr className="my-1 border-border" />
                <button
                  type="button"
                  onClick={remove}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir card
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Grid layout render (default)
  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300",
        asset.archived && "opacity-75 hover:opacity-100",
        asset.pinned && "ring-1 ring-primary/20"
      )}
    >
      {/* Cover Area */}
      <Link
        href={publishedHref}
        className="relative block h-32 bg-cover bg-center transition-all duration-300"
        style={coverStyle}
        aria-label={`Abrir página publicada do ativo digital ${asset.title}`}
      >
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          {/* Content Type Badge */}
          <span className="flex items-center gap-1.5 rounded-full bg-background/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm">
            <TypeIcon className="h-3 w-3 text-primary" />
            {asset.assetType}
          </span>

          {/* Quick status overlays */}
          <div className="flex gap-1">
            {asset.pinned && (
              <span className="rounded-full bg-background/95 p-1 text-primary shadow-sm" title="Fixado">
                <Pin className="h-3 w-3 fill-current" />
              </span>
            )}
            {asset.favorite && (
              <span className="rounded-full bg-background/95 p-1 text-rose-500 shadow-sm" title="Favorito">
                <Heart className="h-3 w-3 fill-current" />
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content Area */}
      <CardContent className="flex flex-1 flex-col p-5">
        <Link href={publishedHref} className="flex-1 focus-visible:outline-none">
          <div className="flex flex-wrap items-center gap-1.5">
            {asset.category && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wide">
                {asset.category}
              </span>
            )}
            {asset.archived && (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                Arquivado
              </span>
            )}
          </div>

          <h3 className="mt-3 line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition duration-200">
            {asset.title}
          </h3>

          {asset.description ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {asset.description}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground/40 italic">Sem descrição adicional...</p>
          )}

          {asset.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {asset.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground border">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </Link>

        {error && <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-3xs text-destructive">{error}</p>}

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            Editado {new Date(asset.updatedAt).toLocaleDateString("pt-BR")}
          </span>

          <div className="flex items-center gap-1">
            {/* Edit */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Editar ativo"
              asChild
            >
              <Link href={editorHref} aria-label={`Editar ativo digital ${asset.title}`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>

            {/* Favorite toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-muted"
              title={asset.favorite ? "Remover favorito" : "Favoritar"}
              disabled={pending}
              onClick={() => run(() => toggleDigitalAssetFavorite({ assetId: asset.id, value: !asset.favorite }))}
            >
              <Heart className={cn("h-3.5 w-3.5", asset.favorite && "fill-current text-rose-500")} />
            </Button>

            {/* Pin toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
              title={asset.pinned ? "Desfixar" : "Fixar no início"}
              disabled={pending}
              onClick={() => run(() => toggleDigitalAssetPinned({ assetId: asset.id, value: !asset.pinned }))}
            >
              <Pin className={cn("h-3.5 w-3.5", asset.pinned && "fill-current text-primary")} />
            </Button>

            {/* Secondary actions dropdown */}
            <div className="relative" ref={menuRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Mais ações"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>

              {showMenu && (
                <div className="absolute bottom-full right-0 z-30 mb-2 w-44 rounded-xl border bg-card/95 backdrop-blur-md p-1 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => run(() => duplicateDigitalAsset({ assetId: asset.id }), (id) => id && router.push(`/assets/${id}`))}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  >
                    <Files className="h-3.5 w-3.5" />
                    Duplicar card
                  </button>

                  {/* Archive */}
                  <button
                    type="button"
                    onClick={() => run(() => toggleDigitalAssetArchived({ assetId: asset.id, value: !asset.archived }))}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  >
                    {asset.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    {asset.archived ? "Restaurar card" : "Arquivar card"}
                  </button>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={copyInternalLink}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar link
                  </button>

                  {/* Delete */}
                  <hr className="my-1 border-border" />
                  <button
                    type="button"
                    onClick={remove}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir card
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
