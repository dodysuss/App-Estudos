import Link from "next/link";
import { RotateCcw, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CourseFilters({
  search,
  semantic,
  category,
  tags = [],
  selectedTags = [],
  status,
  sort,
  categories = [],
  itemLabel = "curso",
  clearHref = "/",
  folderId,
}: {
  search: string;
  semantic: string;
  category: string;
  tags?: string[];
  selectedTags?: string[];
  status: string;
  sort: string;
  categories?: string[];
  itemLabel?: string;
  clearHref?: string;
  folderId?: string;
}) {
  return (
    <form className="surface-card p-4 md:p-5" method="get">
      {folderId && <input type="hidden" name="folder" value={folderId} />}
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-xl bg-primary/10 p-2 text-primary">
          <SlidersHorizontal className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Refinar biblioteca</h2>
          <p className="text-xs text-muted-foreground">Busca textual, busca semântica, categoria e tags.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder={`Busca textual por nome, descrição ou conteúdo ${itemLabel === "playlist" ? "da" : "do"} ${itemLabel}`}
            className="pl-10"
          />
        </label>

        <label className="relative">
          <Sparkles className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            name="semantic"
            defaultValue={semantic}
            placeholder="Busca semântica: objetivo, ideia, problema ou tema relacionado..."
            className="pl-10"
          />
        </label>

        <select name="category" defaultValue={category} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select name="tag" defaultValue={selectedTags[0] ?? ""} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Todas as tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>#{tag}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[180px_190px_auto]">
        <select name="status" defaultValue={status} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
          <option value="all">Todos</option>
          <option value="not-started">Não iniciados</option>
          <option value="in-progress">Em andamento</option>
          <option value="completed">Concluídos</option>
        </select>

        <select name="sort" defaultValue={sort} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
          <option value="created">Mais recentes</option>
          <option value="name">Nome</option>
          <option value="progress-desc">Maior progresso</option>
          <option value="progress-asc">Menor progresso</option>
        </select>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1 lg:flex-none">Aplicar</Button>
          <Button variant="outline" asChild className="flex-1 lg:flex-none">
            <Link href={clearHref}>
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
