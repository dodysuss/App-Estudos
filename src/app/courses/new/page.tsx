import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CourseForm } from "@/components/course-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Novo curso" };

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" asChild className="-ml-3"><Link href="/"><ArrowLeft className="h-4 w-4" />Voltar ao painel</Link></Button>
      <Card><CardHeader><CardTitle className="text-2xl">Cadastrar novo curso</CardTitle><CardDescription>Informe os dados básicos. As aulas serão geradas automaticamente.</CardDescription></CardHeader><CardContent><CourseForm /></CardContent></Card>
    </div>
  );
}
