import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DigitalAssetForm } from "@/components/digital-asset-form";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Novo ativo digital" };

export default async function NewAssetPage() {
  const user = await requireUser();
  const folders = await prisma.folder.findMany({
    where: { userId: user.id, scope: "DIGITAL_ASSET" },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos ativos
          </Link>
        </Button>

        <div className="pill">
          <Sparkles className="h-4 w-4 text-primary" />
          Novo card
        </div>
      </div>

      <header>
        <p className="eyebrow">Ativo digital</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Criar card</h1>
      </header>

      <DigitalAssetForm folders={folders} />
    </div>
  );
}
