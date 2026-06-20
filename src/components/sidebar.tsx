import Link from "next/link";
import { BookOpenCheck, LayoutDashboard, PlusCircle } from "lucide-react";

const links = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/courses/new", label: "Novo curso", icon: PlusCircle },
];

export function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <aside className={mobile ? "h-full w-full bg-card p-5" : "fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card p-5 lg:block"}>
      <Link href="/" onClick={onNavigate} className="mb-9 flex items-center gap-3 px-2">
        <span className="rounded-xl bg-primary p-2 text-primary-foreground"><BookOpenCheck className="h-6 w-6" /></span>
        <span><strong className="block text-base">App de Estudos</strong><span className="text-xs text-muted-foreground">Seu ritmo, seu progresso</span></span>
      </Link>
      <nav className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
