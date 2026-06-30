"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  BookOpen,
  BookOpenCheck,
  Bookmark,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Code,
  ExternalLink,
  FileText,
  FolderKanban,
  Heart,
  Image,
  LayoutDashboard,
  Lightbulb,
  ListVideo,
  LogOut,
  NotebookPen,
  Pin,
  Plus,
  Sparkles,
  Terminal,
  UserCircle,
  Zap,
} from "lucide-react";
import { logoutUser } from "@/actions/auth-actions";
import { getSidebarData } from "@/actions/digital-asset-actions";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Map types to corresponding icons
const typeIconMap: Record<string, typeof Terminal> = {
  Nota: FileText,
  Hack: Zap,
  Prompt: Terminal,
  Código: Code,
  Link: ExternalLink,
  Documento: Bookmark,
  Imagem: Image,
  Checklist: BookOpenCheck,
  Ideia: Lightbulb,
  "Ativo digital": Boxes,
  Projeto: FolderKanban,
  Referência: Bookmark,
};

export function Sidebar({
  currentUser,
  mobile = false,
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: {
  currentUser: CurrentUser;
  mobile?: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const desktopCollapsed = collapsed && !mobile;

  // Dynamic Sidebar data
  const [sidebarData, setSidebarData] = useState<{
    categories: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    types: Record<string, number>;
    counts: { total: number; pinned: number; favorite: number; archived: number };
  }>({
    categories: [],
    tags: [],
    types: {},
    counts: { total: 0, pinned: 0, favorite: 0, archived: 0 },
  });

  useEffect(() => {
    let active = true;
    async function loadData() {
      const result = await getSidebarData();
      if (active && result.success && result.data) {
        setSidebarData(result.data);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [pathname]);

  function isLinkActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLink({
    href,
    label,
    icon: Icon,
    count,
    activeOverride,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
    activeOverride?: boolean;
  }) {
    const isActive = activeOverride !== undefined ? activeOverride : isLinkActive(href);
    return (
      <Link
        href={href}
        onClick={onNavigate}
        title={desktopCollapsed ? label : undefined}
        className={cn(
          "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
          desktopCollapsed ? "justify-center px-2" : "",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
          {!desktopCollapsed && <span className="truncate">{label}</span>}
        </div>
        {!desktopCollapsed && count !== undefined && count > 0 && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-2xs font-semibold tracking-wider",
              isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
            )}
          >
            {count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card/60 backdrop-blur-xl transition-[width] duration-300",
        mobile
          ? "h-full w-full p-5"
          : "fixed inset-y-0 left-0 z-30 hidden p-4 lg:flex",
        !mobile && (desktopCollapsed ? "w-20" : "w-72")
      )}
    >
      {/* Sidebar Header */}
      <div className={cn("flex items-center gap-2 mb-6", desktopCollapsed ? "justify-center" : "justify-between")}>
        <Link
          href="/"
          onClick={onNavigate}
          className={cn("flex min-w-0 items-center gap-3 rounded-2xl p-1 transition hover:bg-accent/40", desktopCollapsed && "justify-center")}
          title="Banco Intelectual"
        >
          <span className="rounded-xl bg-primary p-2 text-primary-foreground shadow-md shadow-primary/25">
            <Boxes className="h-5 w-5" />
          </span>
          {!desktopCollapsed && (
            <div className="min-w-0">
              <strong className="block truncate text-sm font-bold tracking-tight text-foreground">Banco Intelectual</strong>
              <span className="text-[10px] text-muted-foreground font-semibold">SEGURANÇA DE CONHECIMENTO</span>
            </div>
          )}
        </Link>

        {!mobile && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden rounded-xl border bg-background/50 p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:block transition"
            aria-label={desktopCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            title={desktopCollapsed ? "Expandir" : "Recolher"}
          >
            {desktopCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Novo Card CTA */}
      <div className="mb-5">
        <Button asChild className="w-full justify-start gap-2.5 rounded-xl py-5" size={desktopCollapsed ? "icon" : "default"}>
          <Link href="/assets/new" onClick={onNavigate} title="Criar Novo Card">
            <Plus className="h-4 w-4 shrink-0" />
            {!desktopCollapsed && <span className="font-semibold">Novo Card</span>}
          </Link>
        </Button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto space-y-5 no-scrollbar pr-1">
        {/* Biblioteca Principal */}
        <div className="space-y-1">
          <p className={cn("px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2", desktopCollapsed && "sr-only")}>
            Biblioteca
          </p>
          <NavLink href="/" label="Visão Geral" icon={LayoutDashboard} />
          <NavLink href="/courses" label="Cursos" icon={BookOpen} />
          <NavLink href="/playlists" label="Playlists" icon={ListVideo} />
          <NavLink href="/notes" label="Anotações" icon={NotebookPen} />
        </div>

        {/* Banco Intelectual - Filtros por Estado */}
        <div className="space-y-1 border-t pt-4">
          <p className={cn("px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2", desktopCollapsed && "sr-only")}>
            Banco Intelectual
          </p>
          <NavLink href="/assets" label="Todos os Cards" icon={Boxes} count={sidebarData.counts.total} activeOverride={isLinkActive("/assets") && !pathname.includes("archived=1") && !pathname.includes("pinned=1") && !pathname.includes("favorite=1") && !pathname.includes("type=")} />
          <NavLink href="/assets?pinned=1" label="Fixados" icon={Pin} count={sidebarData.counts.pinned} activeOverride={pathname.includes("pinned=1")} />
          <NavLink href="/assets?favorite=1" label="Favoritos" icon={Heart} count={sidebarData.counts.favorite} activeOverride={pathname.includes("favorite=1")} />
          <NavLink href="/assets?archived=1" label="Arquivados" icon={Archive} count={sidebarData.counts.archived} activeOverride={pathname.includes("archived=1")} />
        </div>

        {/* Banco Intelectual - Filtros por Tipo de Ativo */}
        {!desktopCollapsed && (
          <div className="space-y-1 border-t pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
              Tipos de Conteúdo
            </p>
            {Object.keys(typeIconMap).map((type) => {
              const count = sidebarData.types[type] || 0;
              if (count === 0) return null;
              const Icon = typeIconMap[type];
              return (
                <NavLink
                  key={type}
                  href={`/assets?type=${encodeURIComponent(type)}`}
                  label={type}
                  icon={Icon}
                  count={count}
                  activeOverride={pathname.includes(`type=${encodeURIComponent(type)}`)}
                />
              );
            })}
          </div>
        )}

        {/* Categorias Dinâmicas */}
        {!desktopCollapsed && sidebarData.categories.length > 0 && (
          <div className="space-y-1 border-t pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
              Categorias
            </p>
            <div className="grid gap-0.5">
              {sidebarData.categories.map((cat) => {
                const isActive = pathname.includes(`category=${encodeURIComponent(cat.name)}`);
                return (
                  <Link
                    key={cat.name}
                    href={`/assets?category=${encodeURIComponent(cat.name)}`}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                      isActive && "bg-muted text-foreground font-semibold"
                    )}
                  >
                    <span className="truncate">/ {cat.name}</span>
                    <span className="rounded bg-muted-foreground/10 px-1.5 py-0.5 text-3xs">{cat.count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags Dinâmicas */}
        {!desktopCollapsed && sidebarData.tags.length > 0 && (
          <div className="space-y-1 border-t pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
              Tags Populares
            </p>
            <div className="flex flex-wrap gap-1 px-3">
              {sidebarData.tags.map((tag) => {
                const isActive = pathname.includes(`tag=${encodeURIComponent(tag.name)}`);
                return (
                  <Link
                    key={tag.name}
                    href={`/assets?tag=${encodeURIComponent(tag.name)}`}
                    onClick={onNavigate}
                    className={cn(
                      "rounded-lg border bg-background/50 px-2 py-1 text-3xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:bg-muted hover:text-foreground",
                      isActive && "border-primary/50 bg-primary/10 text-primary"
                    )}
                  >
                    #{tag.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Perfil & Sair */}
      <div className={cn("mt-auto border-t pt-4 space-y-3", desktopCollapsed && "pt-2")}>
        {desktopCollapsed ? (
          <div className="flex flex-col gap-2 items-center">
            <span className="rounded-xl bg-primary/10 p-2 text-primary" title="Foco por sessão">
              <Sparkles className="h-4 w-4" />
            </span>
            <form action={logoutUser}>
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition duration-200"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-background/50 p-3">
              <div className="flex items-center gap-2">
                <UserCircle className="h-6 w-6 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold leading-none text-foreground">{currentUser.name || "Usuário"}</p>
                  <p className="truncate text-[10px] text-muted-foreground mt-0.5">{currentUser.email}</p>
                </div>
              </div>
            </div>
            <form action={logoutUser}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border bg-background/80 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}

