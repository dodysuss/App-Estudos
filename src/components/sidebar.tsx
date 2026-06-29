"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BookOpenCheck, Boxes, ChevronLeft, ChevronRight, LayoutDashboard, ListVideo, LogOut, NotebookPen, PlusCircle, Sparkles, UserCircle } from "lucide-react";
import { logoutUser } from "@/actions/auth-actions";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const libraryLinks = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/courses", label: "Cursos", icon: BookOpen },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
  { href: "/assets", label: "Ativos Digitais", icon: Boxes },
  { href: "/notes", label: "Anotações", icon: NotebookPen },
];

const createLinks = [
  { href: "/courses/new", label: "Novo curso", icon: PlusCircle },
  { href: "/playlists/new", label: "Importar playlist", icon: PlusCircle },
  { href: "/assets/new", label: "Novo Card", icon: PlusCircle },
];

function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", !isActive && "transition group-hover:scale-105")} />
      <span className={cn(collapsed && "sr-only")}>{label}</span>
    </Link>
  );
}

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
  const desktopCollapsed = collapsed && !mobile;

  return (
    <aside
      className={cn(
        mobile
          ? "h-full w-full bg-card p-5"
          : "fixed inset-y-0 left-0 z-30 hidden border-r bg-card/80 p-5 shadow-soft backdrop-blur-xl transition-[width] duration-300 lg:block",
        !mobile && (desktopCollapsed ? "w-20" : "w-72"),
      )}
    >
      <div className={cn("mb-8 flex items-center gap-2", desktopCollapsed ? "justify-center" : "justify-between")}>
        <Link href="/" onClick={onNavigate} className={cn("flex min-w-0 items-center gap-3 rounded-3xl p-2 transition hover:bg-accent/60", desktopCollapsed && "justify-center")} title="App de Estudos">
          <span className="rounded-2xl bg-gradient-to-br from-primary to-sky-400 p-3 text-white shadow-lg shadow-primary/25">
            <BookOpenCheck className="h-6 w-6" />
          </span>
          {!desktopCollapsed && (
            <span className="min-w-0">
              <strong className="block truncate text-base tracking-tight">App de Estudos</strong>
              <span className="text-xs text-muted-foreground">Aprendizado com contexto</span>
            </span>
          )}
        </Link>

        {!mobile && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-2xl border bg-background/70 p-2 text-muted-foreground transition hover:bg-accent hover:text-primary"
            aria-label={desktopCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            title={desktopCollapsed ? "Expandir" : "Recolher"}
          >
            {desktopCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="space-y-7">
        <nav className="space-y-2" aria-label="Biblioteca">
          <p className={cn("px-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground", desktopCollapsed && "sr-only")}>Biblioteca</p>
          {libraryLinks.map((link) => (
            <NavLink key={link.href} {...link} onNavigate={onNavigate} collapsed={desktopCollapsed} />
          ))}
        </nav>

        <nav className="space-y-2" aria-label="Criação">
          <p className={cn("px-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground", desktopCollapsed && "sr-only")}>Criar</p>
          {createLinks.map((link) => (
            <NavLink key={link.href} {...link} onNavigate={onNavigate} collapsed={desktopCollapsed} />
          ))}
        </nav>
      </div>

      <div className={cn("absolute bottom-5 left-5 right-5 space-y-3 rounded-3xl border bg-background/70 p-4", desktopCollapsed && "p-2")}>
        {desktopCollapsed ? (
          <form action={logoutUser}>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-2xl border bg-background/70 p-2 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Foco por sessão</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Abra o próximo conteúdo, anote e organize seus ativos sem trocar de contexto.
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="mb-3 flex min-w-0 items-center gap-2 text-sm">
                <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{currentUser.name || "Usuário"}</p>
                  <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
              <form action={logoutUser}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-background/70 px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
