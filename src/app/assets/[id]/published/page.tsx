import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, Globe2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ASSET_COVER_COLORS } from "@/lib/digital-assets";
import { normalizeEditorHtml } from "@/lib/rich-html";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExportPdfButton, PublishedAssetHtml } from "@/components/published-asset-html";

export default async function PublishedAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const asset = await prisma.digitalAsset.findFirst({
    where: { id, userId: user.id },
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
              <ExportPdfButton />
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
      </section>
    </article>
  );
}
