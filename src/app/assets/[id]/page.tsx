import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DigitalAssetEditor } from "@/components/digital-asset-editor";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const asset = await prisma.digitalAsset.findFirst({
    where: { id, userId: user.id },
  });
  const folders = await prisma.folder.findMany({
    where: { userId: user.id, scope: "DIGITAL_ASSET" },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });

  if (!asset) notFound();

  return (
    <div className="page-shell">
      <Button variant="ghost" asChild className="-ml-3 w-fit">
        <Link href="/assets">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos ativos
        </Link>
      </Button>

      <DigitalAssetEditor asset={asset} folders={folders} />
    </div>
  );
}
