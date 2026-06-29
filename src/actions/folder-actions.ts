"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { folderCreateSchema } from "@/lib/validations";

export type FolderMutationResult = { success: true; id: string } | { success: false; error: string };

function pathsForScope(scope: string) {
  if (scope === "COURSE") return ["/", "/courses", "/courses/new"];
  if (scope === "VIDEO_PLAYLIST") return ["/", "/playlists", "/playlists/new"];
  return ["/", "/assets", "/assets/new"];
}

export async function createFolder(input: unknown): Promise<FolderMutationResult> {
  const user = await requireUser();
  const parsed = folderCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    if (parsed.data.parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parsed.data.parentId, userId: user.id, scope: parsed.data.scope },
        select: { id: true },
      });
      if (!parent) return { success: false, error: "Pasta pai não encontrada." };
    }

    const folder = await prisma.folder.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        scope: parsed.data.scope,
        parentId: parsed.data.parentId ?? null,
      },
      select: { id: true },
    });

    for (const path of pathsForScope(parsed.data.scope)) revalidatePath(path);
    return { success: true, id: folder.id };
  } catch (error) {
    console.error("Erro ao criar pasta", error);
    return { success: false, error: "Não foi possível criar a pasta. Verifique se já existe uma pasta com esse nome no mesmo nível." };
  }
}
