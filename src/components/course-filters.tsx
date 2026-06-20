import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CourseFilters({ search, status, sort }: { search: string; status: string; sort: string }) {
  return (
    <form className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto]" method="get">
      <label className="relative"><Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" /><Input name="search" defaultValue={search} placeholder="Buscar por nome do curso" className="pl-10" /></label>
      <label className="relative"><SlidersHorizontal className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" /><select name="status" defaultValue={status} className="h-10 rounded-md border bg-background pl-10 pr-8 text-sm"><option value="all">Todos</option><option value="not-started">Não iniciados</option><option value="in-progress">Em andamento</option><option value="completed">Concluídos</option></select></label>
      <select name="sort" defaultValue={sort} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="created">Mais recentes</option><option value="name">Nome</option><option value="progress-desc">Maior progresso</option><option value="progress-asc">Menor progresso</option></select>
      <div className="flex gap-2"><Button type="submit">Aplicar</Button><Button variant="ghost" asChild><Link href="/">Limpar</Link></Button></div>
    </form>
  );
}
