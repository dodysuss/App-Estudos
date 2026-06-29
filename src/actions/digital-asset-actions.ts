"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ASSET_COVER_COLORS, DEFAULT_ASSET_TYPE, isDigitalAssetType } from "@/lib/digital-assets";
import { prisma } from "@/lib/prisma";
import { sanitizeRichHtml } from "@/lib/rich-html";
import { digitalAssetFlagSchema, digitalAssetIdentitySchema, digitalAssetSchema, digitalAssetUpdateSchema } from "@/lib/validations";

export type DigitalAssetFormValues = {
  title: string;
  description: string;
  tags: string;
  category: string;
  assetType: string;
  content: string;
  coverImage: string;
  coverColor: string;
  folderId: string;
};

export type DigitalAssetFormState = {
  message?: string;
  errors?: Partial<Record<keyof DigitalAssetFormValues, string[]>>;
  values?: DigitalAssetFormValues;
};

export type DigitalAssetMutationResult =
  | { success: true; id?: string }
  | { success: false; error: string };

function readAssetFormValues(formData: FormData): DigitalAssetFormValues {
  const assetType = String(formData.get("assetType") ?? DEFAULT_ASSET_TYPE);
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    category: String(formData.get("category") ?? ""),
    assetType: isDigitalAssetType(assetType) ? assetType : DEFAULT_ASSET_TYPE,
    content: String(formData.get("content") ?? ""),
    coverImage: String(formData.get("coverImage") ?? ""),
    coverColor: String(formData.get("coverColor") ?? ASSET_COVER_COLORS[0]),
    folderId: String(formData.get("folderId") ?? ""),
  };
}

function revalidateDigitalAssets(assetId?: string) {
  revalidatePath("/");
  revalidatePath("/assets");
  if (assetId) {
    revalidatePath(`/assets/${assetId}`);
    revalidatePath(`/assets/${assetId}/published`);
  }
}

async function assertAssetFolder(userId: string, folderId: string | undefined) {
  if (!folderId) return;
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId, scope: "DIGITAL_ASSET" },
    select: { id: true },
  });
  if (!folder) throw new Error("Pasta inválida para ativos digitais.");
}

export async function createDigitalAsset(
  _previousState: DigitalAssetFormState,
  formData: FormData,
): Promise<DigitalAssetFormState> {
  const user = await requireUser();
  const values = readAssetFormValues(formData);
  const parsed = digitalAssetSchema.safeParse(values);

  if (!parsed.success) {
    return { message: "Revise os campos destacados.", errors: parsed.error.flatten().fieldErrors, values };
  }

  let assetId = "";

  try {
    await assertAssetFolder(user.id, parsed.data.folderId);
    const content = sanitizeRichHtml(parsed.data.content || "");
    const asset = await prisma.digitalAsset.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        folderId: parsed.data.folderId ?? null,
        tags: parsed.data.tags,
        category: parsed.data.category ?? null,
        assetType: parsed.data.assetType,
        content: content || null,
        coverImage: parsed.data.coverImage ?? null,
        coverColor: parsed.data.coverColor ?? ASSET_COVER_COLORS[0],
      },
      select: { id: true },
    });
    assetId = asset.id;
  } catch (error) {
    console.error("Erro ao criar ativo digital", error);
    return { message: "Não foi possível criar o ativo digital.", values };
  }

  redirect(`/assets/${assetId}`);
}

export async function updateDigitalAsset(input: unknown): Promise<DigitalAssetMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await assertAssetFolder(user.id, parsed.data.folderId);
    const content = sanitizeRichHtml(parsed.data.content || "");
    const updated = await prisma.digitalAsset.updateMany({
      where: { id: parsed.data.assetId, userId: user.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        folderId: parsed.data.folderId ?? null,
        tags: parsed.data.tags,
        category: parsed.data.category ?? null,
        assetType: parsed.data.assetType,
        content: content || null,
        coverImage: parsed.data.coverImage ?? null,
        coverColor: parsed.data.coverColor ?? ASSET_COVER_COLORS[0],
      },
    });
    if (updated.count === 0) return { success: false, error: "Ativo digital não encontrado." };
    revalidateDigitalAssets(parsed.data.assetId);
    return { success: true, id: parsed.data.assetId };
  } catch (error) {
    console.error("Erro ao atualizar ativo digital", error);
    return { success: false, error: "Não foi possível salvar o ativo digital." };
  }
}

export type PublishDigitalAssetResult =
  | { success: true; id: string; publishedAt: string }
  | { success: false; error: string };

export async function publishDigitalAsset(input: unknown): Promise<PublishDigitalAssetResult> {
  const user = await requireUser();
  const parsed = digitalAssetUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!parsed.data.content?.trim()) {
    return { success: false, error: "Escreva algum conteúdo antes de publicar." };
  }

  try {
    await assertAssetFolder(user.id, parsed.data.folderId);
    const publishedAt = new Date();
    const content = sanitizeRichHtml(parsed.data.content);
    const updated = await prisma.digitalAsset.updateMany({
      where: { id: parsed.data.assetId, userId: user.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        folderId: parsed.data.folderId ?? null,
        tags: parsed.data.tags,
        category: parsed.data.category ?? null,
        assetType: parsed.data.assetType,
        content,
        publishedContent: content,
        publishedAt,
        coverImage: parsed.data.coverImage ?? null,
        coverColor: parsed.data.coverColor ?? ASSET_COVER_COLORS[0],
      },
    });
    if (updated.count === 0) return { success: false, error: "Ativo digital não encontrado." };
    revalidateDigitalAssets(parsed.data.assetId);
    return { success: true, id: parsed.data.assetId, publishedAt: publishedAt.toISOString() };
  } catch (error) {
    console.error("Erro ao publicar ativo digital", error);
    return { success: false, error: "Não foi possível publicar o ativo digital." };
  }
}

export async function toggleDigitalAssetPinned(input: unknown): Promise<DigitalAssetMutationResult> {
  return updateDigitalAssetFlag(input, "pinned");
}

export async function toggleDigitalAssetFavorite(input: unknown): Promise<DigitalAssetMutationResult> {
  return updateDigitalAssetFlag(input, "favorite");
}

export async function toggleDigitalAssetArchived(input: unknown): Promise<DigitalAssetMutationResult> {
  return updateDigitalAssetFlag(input, "archived");
}

async function updateDigitalAssetFlag(input: unknown, field: "pinned" | "favorite" | "archived"): Promise<DigitalAssetMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetFlagSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const updated = await prisma.digitalAsset.updateMany({
      where: { id: parsed.data.assetId, userId: user.id },
      data: { [field]: parsed.data.value },
    });
    if (updated.count === 0) return { success: false, error: "Ativo digital não encontrado." };
    revalidateDigitalAssets(parsed.data.assetId);
    return { success: true, id: parsed.data.assetId };
  } catch (error) {
    console.error("Erro ao atualizar ativo digital", error);
    return { success: false, error: "Não foi possível atualizar o ativo digital." };
  }
}

export async function duplicateDigitalAsset(input: unknown): Promise<DigitalAssetMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetIdentitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Ativo digital inválido." };

  try {
    const asset = await prisma.digitalAsset.findFirst({
      where: { id: parsed.data.assetId, userId: user.id },
    });
    if (!asset) return { success: false, error: "Ativo digital não encontrado." };

    const copy = await prisma.digitalAsset.create({
      data: {
        userId: user.id,
        title: `Cópia de ${asset.title}`.slice(0, 120),
        description: asset.description,
        tags: asset.tags,
        category: asset.category,
        assetType: asset.assetType,
        content: asset.content,
        coverImage: asset.coverImage,
        coverColor: asset.coverColor,
        favorite: asset.favorite,
      },
      select: { id: true },
    });

    revalidateDigitalAssets(copy.id);
    return { success: true, id: copy.id };
  } catch (error) {
    console.error("Erro ao duplicar ativo digital", error);
    return { success: false, error: "Não foi possível duplicar o ativo digital." };
  }
}

export async function deleteDigitalAsset(input: unknown): Promise<DigitalAssetMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetIdentitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Ativo digital inválido." };

  try {
    const deleted = await prisma.digitalAsset.deleteMany({
      where: { id: parsed.data.assetId, userId: user.id },
    });
    if (deleted.count === 0) return { success: false, error: "Ativo digital não encontrado." };
    revalidateDigitalAssets(parsed.data.assetId);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir ativo digital", error);
    return { success: false, error: "Não foi possível excluir o ativo digital." };
  }
}
