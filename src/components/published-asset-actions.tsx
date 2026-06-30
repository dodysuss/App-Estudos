"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Copy, Edit3, Heart, Pin, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleDigitalAssetArchived, toggleDigitalAssetFavorite, toggleDigitalAssetPinned } from "@/actions/digital-asset-actions";
import { cn } from "@/lib/utils";

type AssetData = {
  id: string;
  title: string;
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
};

export function PublishedAssetActions({ asset }: { asset: AssetData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [isPinned, setIsPinned] = useState(asset.pinned);
  const [isFavorite, setIsFavorite] = useState(asset.favorite);
  const [isArchived, setIsArchived] = useState(asset.archived);

  function run(
    action: () => Promise<{ success: true } | { success: false; error: string }>,
    successCallback: () => void
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        successCallback();
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  function handleTogglePin() {
    run(
      () => toggleDigitalAssetPinned({ assetId: asset.id, value: !isPinned }),
      () => setIsPinned((prev) => !prev)
    );
  }

  function handleToggleFavorite() {
    run(
      () => toggleDigitalAssetFavorite({ assetId: asset.id, value: !isFavorite }),
      () => setIsFavorite((prev) => !prev)
    );
  }

  function handleToggleArchive() {
    run(
      () => toggleDigitalAssetArchived({ assetId: asset.id, value: !isArchived }),
      () => setIsArchived((prev) => !prev)
    );
  }

  function handleCopyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <div className="flex flex-wrap gap-2 items-center no-print">
      {/* Voltar */}
      <Button asChild variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white rounded-xl">
        <Link href="/assets">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Voltar
        </Link>
      </Button>

      {/* Editar */}
      <Button asChild variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white rounded-xl">
        <Link href={`/assets/${asset.id}`}>
          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Link>
      </Button>

      {/* Favoritar */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={handleToggleFavorite}
        className={cn(
          "bg-white/90 text-slate-950 hover:bg-white rounded-xl",
          isFavorite && "text-rose-600 bg-rose-50 hover:bg-rose-100"
        )}
        title={isFavorite ? "Remover favorito" : "Favoritar"}
      >
        <Heart className={cn("h-3.5 w-3.5 mr-1.5", isFavorite && "fill-current text-rose-500")} />
        {isFavorite ? "Favorito" : "Favoritar"}
      </Button>

      {/* Fixar */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={handleTogglePin}
        className={cn(
          "bg-white/90 text-slate-950 hover:bg-white rounded-xl",
          isPinned && "text-primary bg-primary/10 hover:bg-primary/20"
        )}
        title={isPinned ? "Desfixar" : "Fixar"}
      >
        <Pin className={cn("h-3.5 w-3.5 mr-1.5", isPinned && "fill-current text-primary")} />
        {isPinned ? "Fixado" : "Fixar"}
      </Button>

      {/* Arquivar */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={handleToggleArchive}
        className="bg-white/90 text-slate-950 hover:bg-white rounded-xl"
        title={isArchived ? "Restaurar card" : "Arquivar card"}
      >
        {isArchived ? (
          <>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Restaurar
          </>
        ) : (
          <>
            <Archive className="h-3.5 w-3.5 mr-1.5" />
            Arquivar
          </>
        )}
      </Button>

      {/* Copiar Link */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleCopyLink}
        className="bg-white/90 text-slate-950 hover:bg-white rounded-xl"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copiar link
          </>
        )}
      </Button>
    </div>
  );
}
