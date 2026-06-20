import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type CourseCardData = {
  id: string;
  name: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  nextLesson?: number;
};

export function CourseCard({ course, compact = false }: { course: CourseCardData; compact?: boolean }) {
  return (
    <Card className="group transition hover:-translate-y-0.5 hover:border-primary/40">
      <CardHeader className={compact ? "p-5 pb-3" : undefined}>
        <div className="mb-2 flex items-center justify-between"><span className="rounded-lg bg-primary/10 p-2 text-primary"><BookOpen className="h-5 w-5" /></span><span className="text-sm font-semibold text-primary">{course.progress}%</span></div>
        <CardTitle className="line-clamp-2 text-lg">{course.name}</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "px-5 pb-5" : undefined}>
        <Progress value={course.progress} />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{course.completedLessons} de {course.totalLessons} aulas</span>
          {course.progress === 100 ? <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" />Concluído</span> : <span>Próxima: aula {course.nextLesson ?? 1}</span>}
        </div>
        <Link href={`/courses/${course.id}`} className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">Abrir curso <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
      </CardContent>
    </Card>
  );
}
