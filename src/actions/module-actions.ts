"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moduleCreateSchema, moduleOrderSchema } from "@/lib/validations";

export type ModuleMutationResult = { success: true } | { success: false; error: string };

export async function createCourseModule(input: unknown): Promise<ModuleMutationResult> {
  const user = await requireUser();
  const parsed = moduleCreateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Módulo inválido." };

  try {
    await prisma.$transaction(async (transaction) => {
      const course = await transaction.course.findFirst({
        where: { id: parsed.data.courseId, kind: "COURSE", userId: user.id },
        select: { id: true },
      });
      if (!course) throw new Error("COURSE_NOT_FOUND");
      const lastModule = await transaction.courseModule.findFirst({
        where: { courseId: parsed.data.courseId, course: { is: { userId: user.id } } },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await transaction.courseModule.create({
        data: {
          courseId: parsed.data.courseId,
          name: parsed.data.name,
          position: (lastModule?.position ?? 0) + 1,
        },
      });
    });
    revalidatePath(`/courses/${parsed.data.courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar módulo", error);
    return { success: false, error: "Não foi possível criar o módulo." };
  }
}

export async function reorderCourseModules(input: unknown): Promise<ModuleMutationResult> {
  const user = await requireUser();
  const parsed = moduleOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Ordem dos módulos inválida." };

  try {
    await prisma.$transaction(async (transaction) => {
      const course = await transaction.course.findFirst({
        where: { id: parsed.data.courseId, kind: "COURSE", userId: user.id },
        select: { id: true },
      });
      if (!course) throw new Error("COURSE_NOT_FOUND");

      const ownedModules = await transaction.courseModule.count({
        where: { courseId: parsed.data.courseId, course: { is: { userId: user.id } } },
      });
      if (ownedModules !== parsed.data.moduleIds.length) throw new Error("MODULE_SET_MISMATCH");

      for (const [index, moduleId] of parsed.data.moduleIds.entries()) {
        const updated = await transaction.courseModule.updateMany({
          where: { id: moduleId, courseId: parsed.data.courseId, course: { is: { userId: user.id } } },
          data: { position: -(index + 1) },
        });
        if (updated.count !== 1) throw new Error("MODULE_NOT_FOUND");
      }
      for (const [index, moduleId] of parsed.data.moduleIds.entries()) {
        await transaction.courseModule.update({ where: { id: moduleId }, data: { position: index + 1 } });
      }
    });
    revalidatePath(`/courses/${parsed.data.courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao reordenar módulos", error);
    return { success: false, error: "Não foi possível salvar a nova ordem dos módulos." };
  }
}
