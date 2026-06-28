import Link from "next/link";
import { ArrowLeft, BookOpen, Layers3, NotebookPen } from "lucide-react";
import { CourseForm } from "@/components/course-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Novo curso" };

export default function NewCoursePage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="space-y-4">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos cursos
          </Link>
        </Button>

        <section className="hero-surface">
          <p className="eyebrow">Novo curso</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Monte a estrutura antes de começar.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Informe a quantidade de aulas e o app cria o checklist automaticamente. Depois você pode renomear aulas, criar módulos e anexar materiais.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex gap-3 rounded-2xl border bg-background/60 p-3">
              <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
              <span>Funciona para qualquer plataforma ou formato.</span>
            </div>
            <div className="flex gap-3 rounded-2xl border bg-background/60 p-3">
              <Layers3 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Separe as aulas por módulos quando quiser.</span>
            </div>
            <div className="flex gap-3 rounded-2xl border bg-background/60 p-3">
              <NotebookPen className="mt-0.5 h-4 w-4 text-primary" />
              <span>Anotações ficam dentro de cada aula.</span>
            </div>
          </div>
        </section>
      </aside>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cadastrar curso</CardTitle>
          <CardDescription>Preencha os dados básicos. Campos corretos permanecem preenchidos se houver erro.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm />
        </CardContent>
      </Card>
    </div>
  );
}
