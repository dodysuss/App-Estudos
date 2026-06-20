"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Cloud, Loader2, TriangleAlert } from "lucide-react";
import { saveStudyNote } from "@/actions/note-actions";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/markdown-editor";
import { YouTubePlayer } from "@/components/youtube-player";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type InitialNote = { videoUrl: string | null; videoId: string | null; content: string | null; updatedAt: string };

export function NotesEditor({ courseId, lessonId, initial }: { courseId: string; lessonId: string; initial?: InitialNote }) {
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt ?? "");
  const initialized = useRef(false);
  const videoId = videoUrl ? extractYouTubeVideoId(videoUrl) : null;

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    if (videoUrl && !videoId) { setStatus("error"); setMessage("Cole uma URL válida do YouTube."); return; }
    setStatus("saving"); setMessage("");
    const timer = window.setTimeout(async () => {
      const result = await saveStudyNote({ courseId, lessonId, videoUrl, content });
      if (result.success) { setStatus("saved"); setUpdatedAt(result.updatedAt); }
      else { setStatus("error"); setMessage(result.error); }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [content, courseId, lessonId, videoId, videoUrl]);

  const label = status === "saving" ? "Salvando..." : status === "saved" ? "Salvo" : status === "error" ? message : "Alterações salvas automaticamente";
  const StatusIcon = status === "saving" ? Loader2 : status === "saved" ? Check : status === "error" ? TriangleAlert : Cloud;
  return (
    <div className="space-y-5">
      <div className="space-y-2"><label htmlFor={`video-url-${lessonId}`} className="text-sm font-medium">URL do YouTube</label><Input id={`video-url-${lessonId}`} type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." aria-invalid={status === "error" && !!videoUrl && !videoId} /></div>
      <YouTubePlayer videoId={videoId} />
      <div className="space-y-2"><label className="text-sm font-medium">Anotações em Markdown</label><MarkdownEditor value={content} onChange={setContent} placeholder="## Conceitos importantes\n\nRegistre dúvidas, links, exemplos e próximos passos..." /></div>
      <div className={`flex flex-wrap items-center gap-2 text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}><StatusIcon className={`h-3.5 w-3.5 ${status === "saving" ? "animate-spin" : ""}`} /><span>{label}</span>{updatedAt && status !== "error" && <span>• Última atualização: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(updatedAt))}</span>}</div>
    </div>
  );
}
