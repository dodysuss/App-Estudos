import Link from "next/link";
import { ArrowLeft, ListVideo, NotebookPen, PlaySquare } from "lucide-react";
import { CourseForm } from "@/components/course-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Nova playlist" };

export default function NewPlaylistPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="space-y-4">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/playlists">
            <ArrowLeft className="h-4 w-4" />
            Voltar às playlists
          </Link>
        </Button>

        <section className="hero-surface">
          <p className="eyebrow">Importação em lote</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Cole uma playlist. O app monta a sala de estudo.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use uma playlist pública do YouTube. O app busca os vídeos, cria os itens e abre a próxima tela com os embeds prontos.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex gap-3 rounded-2xl border bg-background/60 p-3">
              <ListVideo className="mt-0.5 h-4 w-4 text-primary" />
              <span>Sem preencher quantidade manualmente.</span>
            </div>
            <div className="flex gap-3 rounded-2xl border bg-background/60 p-3">
              <PlaySquare className="mt-0.5 h-4 w-4 text-primary" />
              <span>Cada vídeo vira um item com player embutido.</span>
            </div>
            <div className="flex gap-3 rounded-2xl border bg-background/60 p-3">
              <NotebookPen className="mt-0.5 h-4 w-4 text-primary" />
              <span>Anote em Markdown abaixo de cada vídeo.</span>
            </div>
          </div>
        </section>
      </aside>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cadastrar playlist</CardTitle>
          <CardDescription>Cole a URL pública da playlist. O app fará a importação automaticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm kind="VIDEO_PLAYLIST" />
        </CardContent>
      </Card>
    </div>
  );
}
