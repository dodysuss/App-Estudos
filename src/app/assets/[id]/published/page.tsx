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
import { PublishedAssetActions } from "@/components/published-asset-actions";

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
      <section className="bg-cover bg-center px-5 py-10 text-white md:px-10 md:py-16" style={coverStyle}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-3 no-print">
            <PublishedAssetActions
              asset={{
                id: asset.id,
                title: asset.title,
                pinned: asset.pinned,
                favorite: asset.favorite,
                archived: asset.archived,
              }}
            />
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

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1 text-2xs font-extrabold text-slate-950 uppercase tracking-wider">{asset.assetType}</span>
              {asset.category && <span className="rounded-full bg-white/15 px-3 py-1 text-2xs font-bold backdrop-blur tracking-wide">/ {asset.category}</span>}
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">{asset.title}</h1>
            {asset.description && <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-white/90">{asset.description}</p>}
            {asset.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-white/10 px-2 py-0.5 text-3xs font-semibold backdrop-blur">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card/60 p-5 shadow-sm md:p-8">
          <PublishedAssetHtml html={normalizeEditorHtml(asset.publishedContent)} />
        </div>
        {asset.stages.length > 0 && (
          <div className="mx-auto mt-8 max-w-3xl space-y-6">
            <div>
              <p className="eyebrow">Etapas de Execução</p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">Etapas do Ativo</h2>
            </div>
            {asset.stages.map((stage) => (
              <section key={stage.id} className="rounded-2xl border bg-card/60 p-5 shadow-sm md:p-6">
                <h3 className="text-xl font-bold tracking-tight text-foreground">{stage.title}</h3>
                {stage.content ? (
                  <div className="mt-4">
                    <PublishedAssetHtml html={normalizeEditorHtml(stage.content)} />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground italic">Esta etapa ainda não tem conteúdo detalhado.</p>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
