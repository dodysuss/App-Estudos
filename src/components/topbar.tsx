"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Boxes, ChevronLeft, ChevronRight, LayoutGrid, List, Menu, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Topbar({
  currentUser,
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  currentUser: CurrentUser;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAssetsPage = pathname.startsWith("/assets") && pathname !== "/assets/new" && !pathname.match(/\/assets\/[a-zA-Z0-9_-]+\/published/);
  const viewMode = searchParams.get("view") || "grid";

  function handleToggleView() {
    const params = new URLSearchParams(searchParams.toString());
    const nextView = viewMode === "list" ? "grid" : "list";
    params.set("view", nextView);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Determine search action based on active page
  const searchAction = pathname.startsWith("/assets") ? "/assets" : "/";
  const searchPlaceholder = pathname.startsWith("/assets") ? "Procurar no Banco Intelectual..." : "Procurar no painel...";

  // Dynamic breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label =
      segment === "assets"
        ? "Cards"
        : segment === "courses"
          ? "Cursos"
          : segment === "playlists"
            ? "Playlists"
            : segment === "notes"
              ? "Anotações"
              : segment === "new"
                ? "Novo"
                : segment === "published"
                  ? "Leitura"
                  : segment.length > 12
                    ? "Detalhes"
                    : segment;
    return { href, label };
  });

  return (
    <>
      <header className={cn("sticky top-0 z-20 border-b bg-background/50 backdrop-blur-xl transition-[margin] duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Mobile Sidebar toggle */}
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Menu className="h-4 w-4" />
            </Button>

            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex shrink-0"
              onClick={onToggleSidebar}
              aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            {/* Dynamic Breadcrumbs */}
            <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex shrink-0 mr-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground transition font-medium">Home</Link>
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.href} className="flex items-center gap-1.5">
                  <span className="text-muted-foreground/45">/</span>
                  <Link
                    href={crumb.href}
                    className={cn(
                      "hover:text-foreground transition font-medium",
                      idx === breadcrumbs.length - 1 && "text-foreground font-semibold pointer-events-none"
                    )}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Global Search Box */}
            <form action={searchAction} method="get" className="relative flex-1 max-w-md min-w-0">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={searchParams.get("search") ?? ""}
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-background/50 pl-9 pr-12 rounded-xl border border-border focus-visible:ring-primary/20 text-xs shadow-none"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground select-none pointer-events-none">
                <span className="text-[10px]">⌘</span>K
              </span>
            </form>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle (Grade / Lista) for Assets Page */}
            {isAssetsPage && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border bg-background/50"
                onClick={handleToggleView}
                title={viewMode === "list" ? "Visualizar em Grade" : "Visualizar em Lista"}
              >
                {viewMode === "list" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
            )}

            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex rounded-xl bg-background/50 text-xs">
              <Link href="/notes">
                <Search className="h-3.5 w-3.5 mr-1" />
                Buscar notas
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl text-xs">
              <Link href="/assets/new">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Novo Card
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-80 max-w-[85vw] shadow-2xl">
            <Sidebar currentUser={currentUser} mobile onNavigate={() => setOpen(false)} />
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 rounded-xl hover:bg-muted" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
