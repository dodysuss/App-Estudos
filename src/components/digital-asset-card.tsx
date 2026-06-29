"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Copy, Files, Heart, Pin, RotateCcw, Trash2 } from "lucide-react";
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

export function DigitalAssetCard({ asset }: { asset: DigitalAssetCardData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const href = `/assets/${asset.id}`;
  const coverStyle = asset.coverImage
    ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,.08), rgba(15,23,42,.35)), url(${asset.coverImage})` }
    : { background: asset.coverColor || ASSET_COVER_COLORS[0] };

  function run(action: () => Promise<{ success: true; id?: string } | { success: false; error: string }>, after?: (id?: string) => void) {
    setError("");
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
    const url = `${window.location.origin}${href}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }

  function remove() {
    const confirmed = window.confirm(`Excluir o ativo digital "${asset.title}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    run(() => deleteDigitalAsset({ assetId: asset.id }));
  }

  return (
    <Card className={`group overflow-hidden transition hover:-translate-y-1 hover:border-primary/30 ${asset.archived ? "opacity-75" : ""}`}>
      <Link href={href} className="block h-44 bg-cover bg-center" style={coverStyle} aria-label={`Abrir ativo digital ${asset.title}`}>
        <div className="flex h-full items-start justify-between p-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 shadow-sm">{asset.assetType}</span>
          <div className="flex gap-2">
            {asset.pinned && <span className="rounded-full bg-white/90 p-2 text-primary shadow-sm"><Pin className="h-4 w-4 fill-current" /></span>}
            {asset.favorite && <span className="rounded-full bg-white/90 p-2 text-rose-500 shadow-sm"><Heart className="h-4 w-4 fill-current" /></span>}
          </div>
        </div>
      </Link>

      <CardContent className="p-5">
        <div className="min-h-32">
          <div className="flex flex-wrap items-center gap-2">
            {asset.category && <span className="pill border-primary/20 bg-primary/10 text-primary">{asset.category}</span>}
            {asset.archived && <span className="pill border-amber-500/20 bg-amber-500/10 text-amber-600">Arquivado</span>}
          </div>
          <Link href={href} className="mt-3 block">
            <h3 className="line-clamp-2 text-xl font-bold tracking-tight transition group-hover:text-primary">{asset.title}</h3>
          </Link>
          {asset.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{asset.description}</p>}
          {asset.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {asset.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="pill">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mb-3 rounded-xl bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Button type="button" variant="outline" size="icon" title={asset.pinned ? "Desfixar" : "Fixar no início"} disabled={pending} onClick={() => run(() => toggleDigitalAssetPinned({ assetId: asset.id, value: !asset.pinned }))}>
            <Pin className={`h-4 w-4 ${asset.pinned ? "fill-current text-primary" : ""}`} />
          </Button>
          <Button type="button" variant="outline" size="icon" title={asset.favorite ? "Remover favorito" : "Favoritar"} disabled={pending} onClick={() => run(() => toggleDigitalAssetFavorite({ assetId: asset.id, value: !asset.favorite }))}>
            <Heart className={`h-4 w-4 ${asset.favorite ? "fill-current text-rose-500" : ""}`} />
          </Button>
          <Button type="button" variant="outline" size="icon" title="Duplicar" disabled={pending} onClick={() => run(() => duplicateDigitalAsset({ assetId: asset.id }), (id) => id && router.push(`/assets/${id}`))}>
            <Files className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" title={asset.archived ? "Restaurar" : "Arquivar"} disabled={pending} onClick={() => run(() => toggleDigitalAssetArchived({ assetId: asset.id, value: !asset.archived }))}>
            {asset.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" size="icon" title={copied ? "Link copiado" : "Copiar link interno"} onClick={copyInternalLink}>
            <Copy className={`h-4 w-4 ${copied ? "text-emerald-500" : ""}`} />
          </Button>
          <Button type="button" variant="outline" size="icon" title="Excluir" disabled={pending} onClick={remove} className="border-destructive/30 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
