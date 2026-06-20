import { PlayCircle } from "lucide-react";

export function YouTubePlayer({ videoId }: { videoId: string | null }) {
  if (!videoId) return <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed bg-muted/40"><div className="text-center text-muted-foreground"><PlayCircle className="mx-auto mb-2 h-10 w-10" /><p className="text-sm">Cole uma URL do YouTube para começar.</p></div></div>;
  return <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${videoId}`} title="Vídeo do curso" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>;
}
