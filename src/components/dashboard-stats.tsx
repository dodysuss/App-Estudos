import { BookOpen, CheckCircle2, CircleDashed, ListVideo, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function DashboardStats({
  stats,
}: {
  stats: { courses: number; playlists: number; lessons: number; completed: number; pending: number; progress: number };
}) {
  const items = [
    { label: "Cursos", value: stats.courses, icon: BookOpen, tone: "bg-indigo-500/10 text-indigo-500" },
    { label: "Playlists", value: stats.playlists, icon: ListVideo, tone: "bg-fuchsia-500/10 text-fuchsia-500" },
    { label: "Concluídos", value: stats.completed, icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-500" },
    { label: "Pendentes", value: stats.pending, icon: CircleDashed, tone: "bg-amber-500/10 text-amber-500" },
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_2fr]">
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progresso geral</p>
              <p className="mt-2 text-4xl font-bold tracking-tight">{stats.progress}%</p>
            </div>
            <span className="rounded-2xl bg-primary/10 p-3 text-primary">
              <TrendingUp className="h-6 w-6" />
            </span>
          </div>
          <Progress value={stats.progress} className="mt-5" />
          <p className="mt-3 text-sm text-muted-foreground">
            {stats.completed} de {stats.lessons} itens concluídos.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="transition hover:-translate-y-0.5 hover:border-primary/25">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
              </div>
              <span className={`rounded-2xl p-3 ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
