import Link from "next/link";
import { Archive, Boxes, Plus, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DIGITAL_ASSET_TYPES } from "@/lib/digital-assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DigitalAssetCard } from "@/components/digital-asset-card";
import { FolderCreateForm } from "@/components/folder-create-form";
import { buildFolderOptions } from "@/lib/folders";

type SearchParams = Promise<{ search?: string; category?: string; type?: string; archived?: string; folder?: string }>;

function normalize(value?: string) {
  return value?.trim() ?? "";
}

export const metadata = { title: "Ativos Digitais" };

export default async function AssetsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const search = normalize(params.search).toLocaleLowerCase("pt-BR");
  const category = normalize(params.category);
  const type = normalize(params.type);
  const folderId = normalize(params.folder);
  const showArchived = params.archived === "1";

  const assets = await prisma.digitalAsset.findMany({
    where: { userId: user.id, archived: showArchived },
    orderBy: [{ pinned: "desc" }, { favorite: "desc" }, { updatedAt: "desc" }],
  });

  const categories = [
    ...new Set(
      assets
        .map((asset) => asset.category)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const folders = await prisma.folder.findMany({
    where: { userId: user.id, scope: "DIGITAL_ASSET" },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });
  const folderOptions = buildFolderOptions(folders);

  const filteredAssets = assets
    .filter((asset) => {
      if (!search) return true;
      return [asset.title, asset.description ?? "", asset.category ?? "", asset.assetType, ...asset.tags, asset.content ?? ""]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(search));
    })
    .filter((asset) => !category || asset.category === category)
    .filter((asset) => !type || asset.assetType === type)
    .filter((asset) => !folderId || asset.folderId === folderId);

  return (
    <div className="page-shell">
      <section className="hero-surface">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Biblioteca</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Ativos Digitais</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Cards para guardar prompts, hacks, códigos, links, checklists, ideias, referências e outros blocos reutilizáveis.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={showArchived ? "/assets" : "/assets?archived=1"}>
                <Archive className="h-4 w-4" />
                {showArchived ? "Ver ativos" : "Ver arquivados"}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/assets/new">
                <Plus className="h-4 w-4" />
                Novo Card
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <form className="surface-card p-4 md:p-5" method="get">
        {showArchived && <input type="hidden" name="archived" value="1" />}
        {folderId && <input type="hidden" name="folder" value={folderId} />}
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <label className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input name="search" defaultValue={params.search ?? ""} placeholder="Buscar por nome, tag, categoria ou conteúdo..." className="pl-10" />
          </label>

          <select name="category" defaultValue={category} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Todas as categorias</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select name="type" defaultValue={type} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Todos os tipos</option>
            {DIGITAL_ASSET_TYPES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 lg:flex-none">Aplicar</Button>
            <Button asChild variant="outline" className="flex-1 lg:flex-none">
              <Link href={showArchived ? "/assets?archived=1" : "/assets"}>Limpar</Link>
            </Button>
          </div>
        </div>
      </form>

      <section className="space-y-3">
        <FolderCreateForm scope="DIGITAL_ASSET" folders={folders} />
        {folderOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={!folderId ? "secondary" : "outline"} size="sm"><Link href="/assets">Todas as pastas</Link></Button>
            {folderOptions.map((folder) => (
              <Button key={folder.id} asChild variant={folderId === folder.id ? "secondary" : "outline"} size="sm">
                <Link href={`/assets?folder=${folder.id}`}>{folder.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </section>

      {filteredAssets.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Cards de ativos digitais">
          {filteredAssets.map((asset) => (
            <DigitalAssetCard key={asset.id} asset={asset} />
          ))}
        </section>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <Boxes className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">{showArchived ? "Nenhum ativo arquivado" : "Nenhum ativo digital encontrado"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Crie um card ou ajuste os filtros de busca.</p>
            <Button asChild className="mt-6">
              <Link href="/assets/new">Criar Novo Card</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
