import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, Globe2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ASSET_COVER_COLORS } from "@/lib/digital-assets";
import { normalizeEditorHtml } from "@/lib/rich-html";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExportAssetButtons, PublishedAssetHtml } from "@/components/published-asset-html";

export default async function PublishedAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const asset = await prisma.digitalAsset.findFirst({
    where: { id, userId: user.id },
    include: { stages: { orderBy: { position: "asc" } } },
  });

  if (!asset) notFound();

  const coverStyle = asset.coverImage
    ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,.22), rgba(15,23,42,.66)), url(${asset.coverImage})` }
    : { background: asset.coverColor || ASSET_COVER_COLORS[0] };

  if (!asset.publishedContent || !asset.publishedAt) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href={`/assets/${asset.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </Link>
        </Button>
        <Card>
          <CardContent className="p-10 text-center">
            <Globe2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Este ativo ainda não foi publicado</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Abra o editor, revise o conteúdo e clique em “Publicar” para gerar a página.
            </p>
            <Button asChild className="mt-6">
              <Link href={`/assets/${asset.id}`}>
                <Edit3 className="h-4 w-4" />
                Abrir editor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <article className="print-page min-h-screen overflow-hidden rounded-[2rem] border bg-background shadow-soft">
      <section className="bg-cover bg-center px-5 py-8 text-white md:px-10 md:py-14" style={coverStyle}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white">
                <Link href={`/assets/${asset.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <ExportAssetButtons
                asset={{
                  id: asset.id,
                  title: asset.title,
                  description: asset.description,
                  tags: asset.tags,
                  category: asset.category,
                  assetType: asset.assetType,
                  content: normalizeEditorHtml(asset.publishedContent),
                  publishedAt: asset.publishedAt.toISOString(),
                  stages: asset.stages.map((stage) => ({
                    id: stage.id,
                    title: stage.title,
                    content: stage.content ? normalizeEditorHtml(stage.content) : null,
                    position: stage.position,
                  })),
                }}
              />
            </div>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-950">
              Página publicada
            </span>
          </div>

          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-950">{asset.assetType}</span>
              {asset.category && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{asset.category}</span>}
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">{asset.title}</h1>
            {asset.description && <p className="mt-5 max-w-3xl text-lg leading-8 text-white/86">{asset.description}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border bg-card/80 p-5 shadow-soft md:p-10">
          <PublishedAssetHtml html={normalizeEditorHtml(asset.publishedContent)} />
        </div>
        {asset.stages.length > 0 && (
          <div className="mx-auto mt-8 max-w-4xl space-y-5">
            <div>
              <p className="eyebrow">Etapas</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">Etapas do ativo</h2>
            </div>
            {asset.stages.map((stage) => (
              <section key={stage.id} className="rounded-[1.75rem] border bg-card/80 p-5 shadow-soft md:p-8">
                <h3 className="text-2xl font-bold tracking-tight">{stage.title}</h3>
                {stage.content ? (
                  <div className="mt-5">
                    <PublishedAssetHtml html={normalizeEditorHtml(stage.content)} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Esta etapa ainda não tem conteúdo.</p>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
