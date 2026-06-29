"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  lessonModuleSchema,
  lessonNotesSchema,
  lessonOrderSchema,
  lessonPinnedSchema,
  lessonRatingSchema,
  lessonTitleSchema,
  lessonToggleSchema,
} from "@/lib/validations";

export type MutationResult = { success: true; updatedAt: string } | { success: false; error: string };

function ownedLessonWhere(userId: string, lessonId: string, courseId: string) {
  return {
    id: lessonId,
    courseId,
    course: { is: { userId } },
  };
}

function revalidateLessonPages(courseId: string) {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/playlists");
  revalidatePath("/notes");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/playlists/${courseId}`);
  revalidatePath(`/courses/${courseId}/notes`);
}

export async function toggleLesson(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = lessonToggleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados da aula inválidos." };

  try {
    const result = await prisma.lesson.updateMany({
      where: ownedLessonWhere(user.id, parsed.data.lessonId, parsed.data.courseId),
      data: {
        completed: parsed.data.completed,
        completedAt: parsed.data.completed ? new Date() : null,
      },
    });
    if (result.count === 0) return { success: false, error: "Aula não encontrada." };
    revalidateLessonPages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao atualizar aula", error);
    return { success: false, error: "Não foi possível atualizar a aula." };
  }
}

export async function updateLessonNotes(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = lessonNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Anotação inválida." };
  }

  try {
    const result = await prisma.lesson.updateMany({
      where: ownedLessonWhere(user.id, parsed.data.lessonId, parsed.data.courseId),
      data: { notes: parsed.data.notes.trim() || null },
    });
    if (result.count === 0) return { success: false, error: "Aula não encontrada." };
    revalidateLessonPages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao salvar anotação da aula", error);
    return { success: false, error: "Não foi possível salvar a anotação." };
  }
}

export async function updateLessonTitle(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = lessonTitleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Nome da aula inválido." };

  try {
    const result = await prisma.lesson.updateMany({
      where: ownedLessonWhere(user.id, parsed.data.lessonId, parsed.data.courseId),
      data: { title: parsed.data.title || null },
    });
    if (result.count === 0) return { success: false, error: "Aula não encontrada." };
    revalidateLessonPages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao atualizar nome da aula", error);
    return { success: false, error: "Não foi possível atualizar o nome da aula." };
  }
}

export async function updateLessonRating(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = lessonRatingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Avaliação inválida." };

  try {
    const result = await prisma.lesson.updateMany({
      where: ownedLessonWhere(user.id, parsed.data.lessonId, parsed.data.courseId),
      data: { rating: parsed.data.rating },
    });
    if (result.count === 0) return { success: false, error: "Vídeo não encontrado." };
    revalidateLessonPages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao atualizar avaliação do vídeo", error);
    return { success: false, error: "Não foi possível salvar a avaliação." };
  }
}

export async function toggleLessonPinned(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = lessonPinnedSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados de fixação inválidos." };

  try {
    const result = await prisma.lesson.updateMany({
      where: ownedLessonWhere(user.id, parsed.data.lessonId, parsed.data.courseId),
      data: { pinned: parsed.data.pinned },
    });
    if (result.count === 0) return { success: false, error: "Vídeo não encontrado." };
    revalidateLessonPages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao fixar vídeo", error);
    return { success: false, error: "Não foi possível atualizar a fixação do vídeo." };
  }
}

export async function assignLessonModule(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = lessonModuleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Módulo inválido." };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const course = await transaction.course.findFirst({
        where: { id: parsed.data.courseId, kind: "COURSE", userId: user.id },
        select: { id: true },
      });
      if (!course) throw new Error("COURSE_NOT_FOUND");

      if (parsed.data.moduleId) {
        const courseModule = await transaction.courseModule.findFirst({
          where: { id: parsed.data.moduleId, courseId: parsed.data.courseId, course: { is: { userId: user.id } } },
          select: { id: true },
        });
        if (!courseModule) throw new Error("MODULE_NOT_FOUND");
      }
      return transaction.lesson.updateMany({
        where: ownedLessonWhere(user.id, parsed.data.lessonId, parsed.data.courseId),
        data: { moduleId: parsed.data.moduleId },
      });
    });
    if (result.count === 0) return { success: false, error: "Aula não encontrada." };
    revalidateLessonPages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao organizar aula em módulo", error);
    return { success: false, error: "Não foi possível mover a aula para o módulo." };
  }
}

export async function reorderLessons(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = lessonOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Ordem das aulas inválida." };

  try {
    await prisma.$transaction(async (transaction) => {
      const course = await transaction.course.findFirst({
        where: { id: parsed.data.courseId, userId: user.id },
        select: { id: true },
      });
      if (!course) throw new Error("COURSE_NOT_FOUND");

      const lessonCount = await transaction.lesson.count({
        where: { courseId: parsed.data.courseId, course: { is: { userId: user.id } } },
      });
      if (lessonCount !== parsed.data.lessons.length) throw new Error("LESSON_SET_MISMATCH");

      const moduleIds = [...new Set(parsed.data.lessons.map((lesson) => lesson.moduleId).filter((moduleId): moduleId is string => Boolean(moduleId)))];
      if (moduleIds.length) {
        const moduleCount = await transaction.courseModule.count({
          where: { courseId: parsed.data.courseId, id: { in: moduleIds }, course: { is: { userId: user.id } } },
        });
        if (moduleCount !== moduleIds.length) throw new Error("MODULE_SET_MISMATCH");
      }

      for (const lesson of parsed.data.lessons) {
        const updated = await transaction.lesson.updateMany({
          where: ownedLessonWhere(user.id, lesson.id, parsed.data.courseId),
          data: { moduleId: lesson.moduleId, position: lesson.position },
        });
        if (updated.count !== 1) throw new Error("LESSON_NOT_FOUND");
      }
    });
    revalidateLessonPages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao reordenar aulas", error);
    return { success: false, error: "Não foi possível salvar a nova ordem das aulas." };
  }
}
