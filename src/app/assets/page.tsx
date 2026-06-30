import Link from "next/link";
import { Archive, Boxes, Heart, LayoutGrid, List, Pin, Plus, Search, Sparkles, X } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DigitalAssetCard } from "@/components/digital-asset-card";
import { FolderCreateForm } from "@/components/folder-create-form";
import { buildFolderOptions } from "@/lib/folders";
import { matchesStandardFilters, normalizeStandardSearchQuery, uniqueSorted } from "@/lib/search-filters";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{
  search?: string;
  semantic?: string;
  category?: string;
  tag?: string | string[];
  archived?: string;
  folder?: string;
  type?: string;
  pinned?: string;
  favorite?: string;
  recent?: string;
  view?: string;
}>;

function normalize(value?: string) {
  return value?.trim() ?? "";
}

export const metadata = { title: "Banco Intelectual" };

export default async function AssetsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = normalizeStandardSearchQuery(params);
  const folderId = normalize(params.folder);
  const showArchived = params.archived === "1";
  const typeFilter = normalize(params.type);
  const pinnedFilter = params.pinned === "1";
  const favoriteFilter = params.favorite === "1";
  const recentFilter = params.recent === "1";
  const viewMode = params.view === "list" ? "list" : "grid";

  // Fetch all user assets for counts, tags, and categories mapping
  const allUserAssets = await prisma.digitalAsset.findMany({
    where: { userId: user.id, archived: showArchived },
    orderBy: recentFilter ? [{ updatedAt: "desc" }] : [{ pinned: "desc" }, { favorite: "desc" }, { updatedAt: "desc" }],
  });

  const categories = uniqueSorted(allUserAssets.map((asset) => asset.category));
  const tags = uniqueSorted(allUserAssets.flatMap((asset) => asset.tags));

  const folders = await prisma.folder.findMany({
    where: { userId: user.id, scope: "DIGITAL_ASSET" },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });
  const folderOptions = buildFolderOptions(folders);

  // Filter in memory for semantic and metadata queries
  let filteredAssets = allUserAssets.filter((asset) =>
    matchesStandardFilters(
      {
        text: [asset.title, asset.description ?? "", asset.category ?? "", asset.assetType, ...asset.tags, asset.content ?? ""],
        category: asset.category,
        tags: asset.tags,
      },
      query,
    )
  );

  if (folderId) {
    filteredAssets = filteredAssets.filter((asset) => asset.folderId === folderId);
  }
  if (typeFilter) {
    filteredAssets = filteredAssets.filter((asset) => asset.assetType === typeFilter);
  }
  if (pinnedFilter) {
    filteredAssets = filteredAssets.filter((asset) => asset.pinned);
  }
  if (favoriteFilter) {
    filteredAssets = filteredAssets.filter((asset) => asset.favorite);
  }

  // URL Helper to remove a filter parameter
  function getCleanUrl(removeKeys: string[]) {
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (!removeKeys.includes(key) && val) {
        if (Array.isArray(val)) {
          val.forEach((v) => newParams.append(key, v));
        } else {
          newParams.set(key, String(val));
        }
      }
    });
    const queryString = newParams.toString();
    return `/assets${queryString ? "?" + queryString : ""}`;
  }

  // Determine section heading details
  let pageTitle = "Banco Intelectual";
  let pageDescription = "Seu repositório inteligente de anotações, hacks, prompts, códigos e outros ativos digitais.";

  if (showArchived) {
    pageTitle = "Cards Arquivados";
    pageDescription = "Cards desativados ou arquivados temporariamente.";
  } else if (pinnedFilter) {
    pageTitle = "Cards Fixados";
    pageDescription = "Anotações e cartões de conhecimento fixados no topo do seu painel.";
  } else if (favoriteFilter) {
    pageTitle = "Cards Favoritos";
    pageDescription = "Seus cartões de conhecimento marcados como favoritos.";
  } else if (typeFilter) {
    pageTitle = `Cards: ${typeFilter}s`;
    pageDescription = `Todos os seus ativos organizados no formato de ${typeFilter.toLowerCase()}.`;
  }

  const hasActiveFilters =
    query.search ||
    query.category ||
    query.tags.length > 0 ||
    folderId ||
    typeFilter ||
    pinnedFilter ||
    favoriteFilter ||
    recentFilter ||
    query.semantic;

  return (
    <div className="page-shell">
      {/* Hero Header Area */}
      <section className="hero-surface bg-gradient-to-br from-card/90 via-card/70 to-background/50">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Banco de Conhecimento</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {pageTitle}
            </h1>
            <p className="mt-2.5 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {pageDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button asChild variant="outline" className="rounded-xl bg-background/50 hover:bg-muted text-xs">
              <Link href={showArchived ? "/assets" : "/assets?archived=1"}>
                <Archive className="h-3.5 w-3.5 mr-1.5" />
                {showArchived ? "Ver Ativos" : "Ver Arquivados"}
              </Link>
            </Button>
            <Button asChild className="rounded-xl text-xs shadow-md shadow-primary/10">
              <Link href="/assets/new">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Novo Card
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <form className="rounded-2xl border bg-card/60 p-4 md:p-5 shadow-sm space-y-4" method="get">
        {showArchived && <input type="hidden" name="archived" value="1" />}
        {folderId && <input type="hidden" name="folder" value={folderId} />}
        {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
        {pinnedFilter && <input type="hidden" name="pinned" value="1" />}
        {favoriteFilter && <input type="hidden" name="favorite" value="1" />}
        {recentFilter && <input type="hidden" name="recent" value="1" />}
        {params.view && <input type="hidden" name="view" value={params.view} />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={params.search ?? ""} placeholder="Busca por nome, conteúdo..." className="pl-9 bg-background/50 text-xs rounded-xl" />
          </label>

          <label className="relative">
            <Sparkles className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
            <Input name="semantic" defaultValue={params.semantic ?? ""} placeholder="Busca semântica / ideias..." className="pl-9 bg-background/50 text-xs rounded-xl" />
          </label>

          <select
            name="category"
            defaultValue={query.category}
            className="h-10 w-full rounded-xl border bg-background/50 px-3 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todas as categorias</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            name="tag"
            defaultValue={query.tags[0] ?? ""}
            className="h-10 w-full rounded-xl border bg-background/50 px-3 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todas as tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t">
          {/* Active Chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {hasActiveFilters && (
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mr-1">
                Filtros:
              </span>
            )}
            {params.search && (
              <Link href={getCleanUrl(["search"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition">
                Busca: &ldquo;{params.search}&rdquo;
                <X className="h-3 w-3" />
              </Link>
            )}
            {params.semantic && (
              <Link href={getCleanUrl(["semantic"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-primary hover:bg-muted transition">
                Semântica: &ldquo;{params.semantic}&rdquo;
                <X className="h-3 w-3" />
              </Link>
            )}
            {query.category && (
              <Link href={getCleanUrl(["category"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition">
                Cat: {query.category}
                <X className="h-3 w-3" />
              </Link>
            )}
            {query.tags.map((tag) => (
              <Link key={tag} href={getCleanUrl(["tag"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition">
                #{tag}
                <X className="h-3 w-3" />
              </Link>
            ))}
            {typeFilter && (
              <Link href={getCleanUrl(["type"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition">
                Tipo: {typeFilter}
                <X className="h-3 w-3" />
              </Link>
            )}
            {pinnedFilter && (
              <Link href={getCleanUrl(["pinned"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition">
                Fixados
                <X className="h-3 w-3" />
              </Link>
            )}
            {favoriteFilter && (
              <Link href={getCleanUrl(["favorite"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition">
                Favoritos
                <X className="h-3 w-3" />
              </Link>
            )}
            {folderId && (
              <Link href={getCleanUrl(["folder"])} className="inline-flex items-center gap-1 rounded-lg border bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition">
                Pasta
                <X className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="rounded-xl text-xs px-4">
              Aplicar filtros
            </Button>
            {hasActiveFilters && (
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                <Link href={showArchived ? "/assets?archived=1" : "/assets"}>Limpar tudo</Link>
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Folders Selection */}
      <section className="space-y-3.5">
        <FolderCreateForm scope="DIGITAL_ASSET" folders={folders} />
        {folderOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!folderId ? "secondary" : "outline"}
              size="sm"
              className="rounded-xl text-2xs"
            >
              <Link href={getCleanUrl(["folder"])}>Todas as pastas</Link>
            </Button>
            {folderOptions.map((folder) => {
              const folderParams = new URLSearchParams();
              Object.entries(params).forEach(([key, val]) => {
                if (key !== "folder" && val) {
                  if (Array.isArray(val)) {
                    val.forEach((v) => folderParams.append(key, v));
                  } else {
                    folderParams.set(key, String(val));
                  }
                }
              });
              folderParams.set("folder", folder.id);
              return (
                <Button
                  key={folder.id}
                  asChild
                  variant={folderId === folder.id ? "secondary" : "outline"}
                  size="sm"
                  className="rounded-xl text-2xs"
                >
                  <Link href={`/assets?${folderParams.toString()}`}>
                    {folder.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        )}
      </section>

      {/* Cards list output */}
      {filteredAssets.length ? (
        viewMode === "list" ? (
          <section className="flex flex-col gap-3.5" aria-label="Lista de ativos digitais">
            {filteredAssets.map((asset) => (
              <DigitalAssetCard key={asset.id} asset={asset} view="list" />
            ))}
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cards de ativos digitais">
            {filteredAssets.map((asset) => (
              <DigitalAssetCard key={asset.id} asset={asset} view="grid" />
            ))}
          </section>
        )
      ) : (
        /* Empty states */
        <Card className="rounded-2xl border bg-card/40 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto">
            <span className="rounded-2xl bg-muted p-4 text-muted-foreground shadow-sm">
              <Boxes className="h-8 w-8" />
            </span>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
              {showArchived ? "Nenhum ativo arquivado" : "Nenhum card encontrado"}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {hasActiveFilters
                ? "Não encontramos cartões que correspondam aos filtros de busca aplicados. Tente limpar os filtros para ver todos os cards."
                : "Seu Banco Intelectual ainda não tem cards salvos nesta categoria. Crie seu primeiro card para guardar prompts, hacks ou códigos."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {hasActiveFilters ? (
                <Button asChild variant="outline" className="rounded-xl text-xs">
                  <Link href={showArchived ? "/assets?archived=1" : "/assets"}>Limpar filtros</Link>
                </Button>
              ) : (
                <Button asChild className="rounded-xl text-xs">
                  <Link href="/assets/new">Criar Primeiro Card</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

