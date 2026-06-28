"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BookOpenCheck, LayoutDashboard, ListVideo, PlusCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const libraryLinks = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/courses", label: "Cursos", icon: BookOpen },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
];

const createLinks = [
  { href: "/courses/new", label: "Novo curso", icon: PlusCircle },
  { href: "/playlists/new", label: "Importar playlist", icon: PlusCircle },
];

function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", !isActive && "transition group-hover:scale-105")} />
      {label}
    </Link>
  );
}

export function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <aside
      className={
        mobile
          ? "h-full w-full bg-card p-5"
          : "fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card/80 p-5 shadow-soft backdrop-blur-xl lg:block"
      }
    >
      <Link href="/" onClick={onNavigate} className="mb-8 flex items-center gap-3 rounded-3xl p-2 transition hover:bg-accent/60">
        <span className="rounded-2xl bg-gradient-to-br from-primary to-sky-400 p-3 text-white shadow-lg shadow-primary/25">
          <BookOpenCheck className="h-6 w-6" />
        </span>
        <span>
          <strong className="block text-base tracking-tight">App de Estudos</strong>
          <span className="text-xs text-muted-foreground">Aprendizado com contexto</span>
        </span>
      </Link>

      <div className="space-y-7">
        <nav className="space-y-2" aria-label="Biblioteca">
          <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Biblioteca</p>
          {libraryLinks.map((link) => (
            <NavLink key={link.href} {...link} onNavigate={onNavigate} />
          ))}
        </nav>

        <nav className="space-y-2" aria-label="Criação">
          <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Criar</p>
          {createLinks.map((link) => (
            <NavLink key={link.href} {...link} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-3xl border bg-background/70 p-4">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-primary/10 p-2 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Foco por sessão</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Abra a próxima aula, assista, anote e marque progresso sem trocar de contexto.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
