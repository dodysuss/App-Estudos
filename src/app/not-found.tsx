import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center"><SearchX className="mb-4 h-12 w-12 text-muted-foreground" /><h1 className="text-2xl font-bold">Curso não encontrado</h1><p className="mt-2 text-muted-foreground">Este curso não existe ou não está mais disponível.</p><Button asChild className="mt-6"><Link href="/">Voltar ao painel</Link></Button></div>;
}
