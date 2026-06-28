"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl lg:ml-72">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>

            <form action="/" method="get" className="hidden min-w-0 items-center gap-2 rounded-full border bg-card/70 px-2 py-1.5 text-sm text-muted-foreground sm:flex">
              <Search className="ml-1 h-4 w-4 shrink-0" />
              <Input
                name="search"
                placeholder="Procurar cursos, playlists e assuntos"
                className="h-8 min-w-72 border-0 bg-transparent px-1 py-1 shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="sm" className="h-8 rounded-full px-3 text-xs">
                Procurar
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/courses/new">
                <Plus className="h-4 w-4" />
                Novo estudo
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-80 max-w-[88vw] shadow-2xl">
            <Sidebar mobile onNavigate={() => setOpen(false)} />
            <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
