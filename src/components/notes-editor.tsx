"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Cloud, Loader2, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { deletePublishedStudyNote, publishStudyNote, saveStudyNote } from "@/actions/note-actions";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/markdown-editor";
import { YouTubePlayer } from "@/components/youtube-player";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type PublishedNote = { id: string; content: string };
type InitialNote = {
  videoUrl: string | null;
  videoId: string | null;
  content: string | null;
  publishedContent: string | null;
  publishedAt: string | null;
  publications: PublishedNote[];
  updatedAt: string;
};

export function NotesEditor({ courseId, lessonId, initial, showVideo = true }: { courseId: string; lessonId: string; initial?: InitialNote; showVideo?: boolean }) {
  const [videoUrl, setVideoUrl] = useState(showVideo ? initial?.videoUrl ?? "" : "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [publications, setPublications] = useState<PublishedNote[]>(initial?.publications ?? []);
  const [editingPublicationId, setEditingPublicationId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [deletingPublicationId, setDeletingPublicationId] = useState<string | null>(null);
  const initialized = useRef(false);
  const videoId = showVideo && videoUrl ? extractYouTubeVideoId(videoUrl) : null;

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    if (showVideo && videoUrl && !videoId) { setStatus("error"); setMessage("Cole uma URL válida do YouTube."); return; }
    setStatus("saving"); setMessage("");
    const timer = window.setTimeout(async () => {
      const result = await saveStudyNote({ courseId, lessonId, videoUrl: showVideo ? videoUrl : "", content });
      if (result.success) setStatus("saved");
      else { setStatus("error"); setMessage(result.error); }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [content, courseId, lessonId, showVideo, videoId, videoUrl]);

  async function publishCurrentNote() {
    setPublishError("");
    if (!content.trim()) {
      setPublishError("Escreva uma anotação antes de publicar.");
      return;
    }
    if (showVideo && videoUrl && !videoId) {
      setPublishError("Cole uma URL válida do YouTube antes de publicar.");
      return;
    }

    setPublishing(true);
    const result = await publishStudyNote({
      courseId,
      lessonId,
      publicationId: editingPublicationId ?? undefined,
      videoUrl: showVideo ? videoUrl : "",
      content,
    });
    setPublishing(false);

    if (result.success) {
      setPublications((current) => {
        if (result.mode === "updated") {
          return current.map((publication) => publication.id === result.publication.id ? result.publication : publication);
        }
        return [...current, result.publication];
      });
      setContent("");
      setEditingPublicationId(null);
      setStatus("saved");
      setMessage("");
      return;
    }

    setPublishError(result.error);
  }

  function editPublishedNote(publication: PublishedNote) {
    setContent(publication.content);
    setEditingPublicationId(publication.id);
    setPublishError("");
  }

  async function deletePublishedNote(publicationId: string) {
    setPublishError("");
    setDeletingPublicationId(publicationId);
    const result = await deletePublishedStudyNote({ courseId, lessonId, publicationId });
    setDeletingPublicationId(null);

    if (result.success) {
      setPublications((current) => current.filter((publication) => publication.id !== publicationId));
      if (editingPublicationId === publicationId) {
        setEditingPublicationId(null);
        setContent("");
      }
      setStatus("saved");
      return;
    }

    setPublishError(result.error);
  }

  const label = status === "saving" ? "Salvando..." : status === "saved" ? "Salvo" : status === "error" ? message : "Alterações salvas automaticamente";
  const StatusIcon = status === "saving" ? Loader2 : status === "saved" ? Check : status === "error" ? TriangleAlert : Cloud;

  return (
    <div className="space-y-4">
      {showVideo && (
        <div className="rounded-2xl border bg-card/70 p-3">
          <label htmlFor={`video-url-${lessonId}`} className="text-sm font-semibold">URL do vídeo</label>
          <Input
            id={`video-url-${lessonId}`}
            type="url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-invalid={status === "error" && !!videoUrl && !videoId}
            className="mt-2"
          />
        </div>
      )}

      <div className={showVideo ? "grid gap-5 xl:grid-cols-2 xl:items-start" : ""}>
        {showVideo && (
          <div>
            <YouTubePlayer videoId={videoId} />
          </div>
        )}
        <div>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onPublish={publishCurrentNote}
            publishing={publishing}
            publishDisabled={!content.trim()}
          />
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-2 rounded-2xl border bg-background/60 px-3 py-2 text-xs ${status === "error" || publishError ? "text-destructive" : "text-muted-foreground"}`}>
        <StatusIcon className={`h-3.5 w-3.5 ${status === "saving" ? "animate-spin" : ""}`} />
        <span>{publishError || label}</span>
      </div>

      <section className="space-y-3">
        <h4 className="font-semibold">Anotações publicadas</h4>
        {publications.length ? (
          publications.map((publication) => (
            <article key={publication.id} className="rounded-2xl border bg-card/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="font-semibold">Anotação publicada</h5>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => editPublishedNote(publication)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => deletePublishedNote(publication.id)} disabled={deletingPublicationId === publication.id}>
                    {deletingPublicationId === publication.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Apagar
                  </Button>
                </div>
              </div>
              <div className="markdown-preview mt-3 rounded-xl border bg-background/70 p-4 text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>
                  {publication.content}
                </ReactMarkdown>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border bg-card/70 p-4">
            <p className="text-sm text-muted-foreground">Nada publicado ainda. Escreva suas notas e clique em “Publicar”.</p>
          </div>
        )}
      </section>
    </div>
  );
}
