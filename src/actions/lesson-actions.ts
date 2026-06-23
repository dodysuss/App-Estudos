"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { lessonNotesSchema, lessonToggleSchema } from "@/lib/validations";

export type MutationResult = { success: true; updatedAt: string } | { success: false; error: string };

export async function toggleLesson(input: unknown): Promise<MutationResult> {
  const parsed = lessonToggleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados da aula inválidos." };

  try {
    const result = await prisma.lesson.updateMany({
      where: { id: parsed.data.lessonId, courseId: parsed.data.courseId },
      data: {
        completed: parsed.data.completed,
        completedAt: parsed.data.completed ? new Date() : null,
      },
    });
    if (result.count === 0) return { success: false, error: "Aula não encontrada." };
    revalidatePath("/");
    revalidatePath(`/courses/${parsed.data.courseId}`);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao atualizar aula", error);
    return { success: false, error: "Não foi possível atualizar a aula." };
  }
}

export async function updateLessonNotes(input: unknown): Promise<MutationResult> {
  const parsed = lessonNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Anotação inválida." };
  }

  try {
    const result = await prisma.lesson.updateMany({
      where: { id: parsed.data.lessonId, courseId: parsed.data.courseId },
      data: { notes: parsed.data.notes.trim() || null },
    });
    if (result.count === 0) return { success: false, error: "Aula não encontrada." };
    revalidatePath(`/courses/${parsed.data.courseId}`);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao salvar anotação da aula", error);
    return { success: false, error: "Não foi possível salvar a anotação." };
  }
}
