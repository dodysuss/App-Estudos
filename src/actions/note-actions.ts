"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { studyNoteSchema } from "@/lib/validations";
import type { MutationResult } from "@/actions/lesson-actions";

export async function saveStudyNote(input: unknown): Promise<MutationResult> {
  const parsed = studyNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const videoId = parsed.data.videoUrl ? extractYouTubeVideoId(parsed.data.videoUrl) : null;
  const data = {
    videoUrl: parsed.data.videoUrl || null,
    videoId,
    content: parsed.data.content || null,
  };

  try {
    const note = await prisma.$transaction(async (transaction) => {
      const lesson = await transaction.lesson.findFirst({
        where: { id: parsed.data.lessonId, courseId: parsed.data.courseId },
      });
      if (!lesson) throw new Error("LESSON_NOT_FOUND");
      const existing = await transaction.studyNote.findUnique({
        where: { lessonId: parsed.data.lessonId },
      });
      return existing
        ? transaction.studyNote.update({ where: { id: existing.id }, data })
        : transaction.studyNote.create({
            data: { courseId: parsed.data.courseId, lessonId: parsed.data.lessonId, ...data },
          });
    });
    revalidatePath(`/courses/${parsed.data.courseId}`);
    return { success: true, updatedAt: note.updatedAt.toISOString() };
  } catch (error) {
    console.error("Erro ao salvar anotações", error);
    return { success: false, error: "Não foi possível salvar suas anotações." };
  }
}
