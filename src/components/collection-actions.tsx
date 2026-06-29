"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { deleteCourse, refreshPlaylistVideos } from "@/actions/course-actions";
import { Button } from "@/components/ui/button";

export function DeleteCollectionButton({
  courseId,
  kind,
  name,
}: {
  courseId: string;
  kind: "COURSE" | "VIDEO_PLAYLIST";
  name: string;
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const label = kind === "VIDEO_PLAYLIST" ? "playlist" : "curso";

  function remove() {
    setError("");
    const confirmed = window.confirm(`Excluir ${label} "${name}"? Esta ação apaga aulas, vídeos, anotações e materiais vinculados.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCourse({ courseId });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(kind === "VIDEO_PLAYLIST" ? "/playlists" : "/courses");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={remove} disabled={pending} className="border-destructive/30 text-destructive hover:bg-destructive/10">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Excluir {label}
      </Button>
      {error && <p className="max-w-sm text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function RefreshPlaylistButton({ courseId }: { courseId: string }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    setMessage("");
    startTransition(async () => {
      const result = await refreshPlaylistVideos({ courseId });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(result.added > 0 ? `${result.added} vídeo(s) novo(s) adicionados. Total: ${result.total}.` : `Playlist atualizada. Total: ${result.total}.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Atualizar vídeos
      </Button>
      {message && <p className={`max-w-sm text-xs ${message.includes("não") || message.includes("inválida") ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}
    </div>
  );
}
