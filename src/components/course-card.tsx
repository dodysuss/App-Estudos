import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, ListVideo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type CourseCardData = {
  id: string;
  name: string;
  kind?: "COURSE" | "VIDEO_PLAYLIST";
  subject?: string | null;
  tags?: string[];
  totalLessons: number;
  completedLessons: number;
  progress: number;
  nextLesson?: number;
};

export function CourseCard({ course, compact = false }: { course: CourseCardData; compact?: boolean }) {
  const isPlaylist = course.kind === "VIDEO_PLAYLIST";
  const detailHref = isPlaylist ? `/playlists/${course.id}` : `/courses/${course.id}`;
  const noun = isPlaylist ? "vídeos" : "aulas";
  const nextLabel = isPlaylist ? "vídeo" : "aula";
  const isDone = course.progress === 100;

  return (
    <Link
      href={detailHref}
      className="group block h-full rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Abrir ${isPlaylist ? "playlist" : "curso"} ${course.name}`}
    >
      <Card className="relative h-full overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-400 to-fuchsia-400 opacity-80" />
        <CardContent className={compact ? "p-5" : "p-6"}>
          <div className="flex items-start justify-between gap-4">
            <span className={`rounded-2xl p-3 ${isPlaylist ? "bg-fuchsia-500/10 text-fuchsia-500" : "bg-primary/10 text-primary"}`}>
              {isPlaylist ? <ListVideo className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            </span>
            <span className={`pill ${isDone ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}`}>
              {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
              {isDone ? "Concluído" : `${course.progress}%`}
            </span>
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{isPlaylist ? "Playlist" : "Curso"}</p>
            <h3 className="mt-2 line-clamp-2 text-xl font-bold tracking-tight">{course.name}</h3>
          </div>

          {(course.subject || course.tags?.length) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {course.subject && <span className="pill border-primary/20 bg-primary/10 text-primary">{course.subject}</span>}
              {course.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="pill">#{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{course.completedLessons} de {course.totalLessons} {noun}</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">
              {isDone ? "Tudo finalizado" : `Próximo: ${nextLabel} ${course.nextLesson ?? 1}`}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
              Abrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
