import Link from "next/link";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CourseFilters({
  search,
  status,
  sort,
  subjects = [],
  selectedSubjects = [],
  showSubjects = false,
  itemLabel = "curso",
  clearHref = "/",
  folderId,
}: {
  search: string;
  status: string;
  sort: string;
  subjects?: string[];
  selectedSubjects?: string[];
  showSubjects?: boolean;
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
          <p className="text-xs text-muted-foreground">Busque, filtre e ordene sem perder o contexto.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_190px_auto]">
        <label className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder={`Buscar por nome ${itemLabel === "playlist" ? "da" : "do"} ${itemLabel}`}
            className="pl-10"
          />
        </label>

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

      {showSubjects && (
        <fieldset className="mt-4 border-t pt-4">
          <legend className="mb-3 text-sm font-semibold">
            Assuntos <span className="font-normal text-muted-foreground">(múltipla seleção)</span>
          </legend>
          {subjects.length ? (
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <label
                  key={subject}
                  className="flex cursor-pointer items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-sm transition hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input type="checkbox" name="subject" value={subject} defaultChecked={selectedSubjects.includes(subject)} className="h-3.5 w-3.5 accent-primary" />
                  {subject}
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed bg-background/50 p-4 text-sm text-muted-foreground">
              Cadastre o assunto de um curso para habilitar este filtro.
            </p>
          )}
        </fieldset>
      )}
    </form>
  );
}
