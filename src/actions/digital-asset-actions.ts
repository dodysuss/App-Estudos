"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ASSET_COVER_COLORS, DEFAULT_ASSET_TYPE, isDigitalAssetType } from "@/lib/digital-assets";
import { prisma } from "@/lib/prisma";
import { sanitizeRichHtml } from "@/lib/rich-html-server";
import {
  digitalAssetFlagSchema,
  digitalAssetIdentitySchema,
  digitalAssetSchema,
  digitalAssetStageCreateSchema,
  digitalAssetStageIdentitySchema,
  digitalAssetStageOrderSchema,
  digitalAssetStageUpdateSchema,
  digitalAssetUpdateSchema,
} from "@/lib/validations";

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

export type DigitalAssetStageMutationResult =
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
      include: { stages: { orderBy: { position: "asc" } } },
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
        stages: {
          create: asset.stages.map((stage) => ({
            title: stage.title,
            content: stage.content,
            position: stage.position,
          })),
        },
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

export async function createDigitalAssetStage(input: unknown): Promise<DigitalAssetStageMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetStageCreateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Etapa inválida." };

  try {
    const asset = await prisma.digitalAsset.findFirst({
      where: { id: parsed.data.assetId, userId: user.id },
      select: { id: true },
    });
    if (!asset) return { success: false, error: "Ativo digital não encontrado." };

    const stage = await prisma.$transaction(async (transaction) => {
      const lastStage = await transaction.digitalAssetStage.findFirst({
        where: { assetId: asset.id },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      return transaction.digitalAssetStage.create({
        data: {
          assetId: asset.id,
          title: parsed.data.title,
          position: (lastStage?.position ?? 0) + 1,
        },
        select: { id: true },
      });
    });

    revalidateDigitalAssets(asset.id);
    return { success: true, id: stage.id };
  } catch (error) {
    console.error("Erro ao criar etapa do ativo digital", error);
    return { success: false, error: "Não foi possível criar a etapa." };
  }
}

export async function updateDigitalAssetStage(input: unknown): Promise<DigitalAssetStageMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetStageUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Etapa inválida." };

  try {
    const content = sanitizeRichHtml(parsed.data.content || "");
    const updated = await prisma.digitalAssetStage.updateMany({
      where: {
        id: parsed.data.stageId,
        assetId: parsed.data.assetId,
        asset: { is: { userId: user.id } },
      },
      data: {
        title: parsed.data.title,
        content: content || null,
      },
    });
    if (updated.count === 0) return { success: false, error: "Etapa não encontrada." };
    revalidateDigitalAssets(parsed.data.assetId);
    return { success: true, id: parsed.data.stageId };
  } catch (error) {
    console.error("Erro ao salvar etapa do ativo digital", error);
    return { success: false, error: "Não foi possível salvar a etapa." };
  }
}

export async function deleteDigitalAssetStage(input: unknown): Promise<DigitalAssetStageMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetStageIdentitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Etapa inválida." };

  try {
    const deleted = await prisma.digitalAssetStage.deleteMany({
      where: {
        id: parsed.data.stageId,
        assetId: parsed.data.assetId,
        asset: { is: { userId: user.id } },
      },
    });
    if (deleted.count === 0) return { success: false, error: "Etapa não encontrada." };
    revalidateDigitalAssets(parsed.data.assetId);
    return { success: true };
  } catch (error) {
    console.error("Erro ao apagar etapa do ativo digital", error);
    return { success: false, error: "Não foi possível apagar a etapa." };
  }
}

export async function reorderDigitalAssetStages(input: unknown): Promise<DigitalAssetStageMutationResult> {
  const user = await requireUser();
  const parsed = digitalAssetStageOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Ordem das etapas inválida." };

  try {
    await prisma.$transaction(async (transaction) => {
      const stageCount = await transaction.digitalAssetStage.count({
        where: { assetId: parsed.data.assetId, asset: { is: { userId: user.id } } },
      });
      if (stageCount !== parsed.data.stageIds.length) throw new Error("STAGE_SET_MISMATCH");

      for (const [index, stageId] of parsed.data.stageIds.entries()) {
        const updated = await transaction.digitalAssetStage.updateMany({
          where: { id: stageId, assetId: parsed.data.assetId, asset: { is: { userId: user.id } } },
          data: { position: -(index + 1) },
        });
        if (updated.count !== 1) throw new Error("STAGE_NOT_FOUND");
      }

      for (const [index, stageId] of parsed.data.stageIds.entries()) {
        await transaction.digitalAssetStage.update({
          where: { id: stageId },
          data: { position: index + 1 },
        });
      }
    });

    revalidateDigitalAssets(parsed.data.assetId);
    return { success: true };
  } catch (error) {
    console.error("Erro ao reordenar etapas do ativo digital", error);
    return { success: false, error: "Não foi possível salvar a ordem das etapas." };
  }
}

export async function getSidebarData() {
  try {
    const user = await requireUser();
    const assets = await prisma.digitalAsset.findMany({
      where: { userId: user.id },
      select: { category: true, tags: true, archived: true, pinned: true, favorite: true, assetType: true },
    });

    const activeAssets = assets.filter((a) => !a.archived);

    const categoriesMap: Record<string, number> = {};
    activeAssets.forEach((a) => {
      if (a.category?.trim()) {
        const cat = a.category.trim();
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      }
    });
    const categories = Object.entries(categoriesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, 10); // Limit to top 10

    const tagsMap: Record<string, number> = {};
    activeAssets.forEach((a) => {
      a.tags.forEach((t) => {
        const tag = t.trim();
        if (tag) {
          tagsMap[tag] = (tagsMap[tag] || 0) + 1;
        }
      });
    });
    const tags = Object.entries(tagsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, 12); // Limit to top 12

    const typesMap: Record<string, number> = {};
    activeAssets.forEach((a) => {
      typesMap[a.assetType] = (typesMap[a.assetType] || 0) + 1;
    });

    return {
      success: true,
      data: {
        categories,
        tags,
        types: typesMap,
        counts: {
          total: activeAssets.length,
          pinned: activeAssets.filter((a) => a.pinned).length,
          favorite: activeAssets.filter((a) => a.favorite).length,
          archived: assets.filter((a) => a.archived).length,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao obter dados da sidebar:", error);
    return {
      success: false,
      error: "Falha ao carregar metadados da barra lateral",
      data: {
        categories: [],
        tags: [],
        types: {},
        counts: { total: 0, pinned: 0, favorite: 0, archived: 0 },
      },
    };
  }
}
