import { BookOpen, CheckCircle2, CircleDashed, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardStats({ stats }: { stats: { courses: number; lessons: number; completed: number; pending: number; progress: number } }) {
  const items = [
    { label: "Cursos", value: stats.courses, icon: BookOpen, color: "text-indigo-500" },
    { label: "Total de aulas", value: stats.lessons, icon: BookOpen, color: "text-sky-500" },
    { label: "Aulas concluídas", value: stats.completed, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Aulas pendentes", value: stats.pending, icon: CircleDashed, color: "text-amber-500" },
    { label: "Progresso geral", value: `${stats.progress}%`, icon: TrendingUp, color: "text-violet-500" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div><span className="rounded-xl bg-secondary p-3"><Icon className={`h-5 w-5 ${color}`} /></span></CardContent></Card>
      ))}
    </div>
  );
}
