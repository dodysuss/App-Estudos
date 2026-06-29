"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { publishStudyNoteSchema, studyNotePublicationIdentitySchema, studyNoteSchema } from "@/lib/validations";
import type { MutationResult } from "@/actions/lesson-actions";

type PublishedNotePayload = {
  id: string;
  content: string;
};

export type PublishStudyNoteResult =
  | { success: true; updatedAt: string; publication: PublishedNotePayload; mode: "created" | "updated" }
  | { success: false; error: string };

function revalidateNotePages(courseId: string) {
  revalidatePath("/notes");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/playlists/${courseId}`);
  revalidatePath(`/courses/${courseId}/notes`);
}

export async function saveStudyNote(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
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
        where: {
          id: parsed.data.lessonId,
          courseId: parsed.data.courseId,
          course: { is: { userId: user.id } },
        },
      });
      if (!lesson) throw new Error("LESSON_NOT_FOUND");
      const existing = await transaction.studyNote.findFirst({
        where: { lessonId: parsed.data.lessonId, courseId: parsed.data.courseId, course: { is: { userId: user.id } } },
      });
      return existing
        ? transaction.studyNote.update({ where: { id: existing.id }, data })
        : transaction.studyNote.create({
            data: { courseId: parsed.data.courseId, lessonId: parsed.data.lessonId, ...data },
          });
    });
    revalidateNotePages(parsed.data.courseId);
    return { success: true, updatedAt: note.updatedAt.toISOString() };
  } catch (error) {
    console.error("Erro ao salvar anotações", error);
    return { success: false, error: "Não foi possível salvar suas anotações." };
  }
}

export async function publishStudyNote(input: unknown): Promise<PublishStudyNoteResult> {
  const user = await requireUser();
  const parsed = publishStudyNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Anotação inválida." };
  }

  const videoId = parsed.data.videoUrl ? extractYouTubeVideoId(parsed.data.videoUrl) : null;
  const noteData = {
    videoUrl: parsed.data.videoUrl || null,
    videoId,
    content: parsed.data.content || null,
  };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const lesson = await transaction.lesson.findFirst({
        where: {
          id: parsed.data.lessonId,
          courseId: parsed.data.courseId,
          course: { is: { userId: user.id } },
        },
      });
      if (!lesson) throw new Error("LESSON_NOT_FOUND");

      const existing = await transaction.studyNote.findFirst({
        where: { lessonId: parsed.data.lessonId, courseId: parsed.data.courseId, course: { is: { userId: user.id } } },
      });

      const note = existing
        ? await transaction.studyNote.update({ where: { id: existing.id }, data: noteData })
        : await transaction.studyNote.create({
            data: { courseId: parsed.data.courseId, lessonId: parsed.data.lessonId, ...noteData },
          });

      if (parsed.data.publicationId) {
        const updated = await transaction.studyNotePublication.updateMany({
          where: {
            id: parsed.data.publicationId,
            studyNoteId: note.id,
            studyNote: { is: { course: { is: { userId: user.id } } } },
          },
          data: { content: parsed.data.content },
        });
        if (updated.count === 0) throw new Error("PUBLICATION_NOT_FOUND");
        const publication = await transaction.studyNotePublication.findUnique({
          where: { id: parsed.data.publicationId },
        });
        if (!publication) throw new Error("PUBLICATION_NOT_FOUND");
        return { note, publication, mode: "updated" as const };
      }

      const publication = await transaction.studyNotePublication.create({
        data: { studyNoteId: note.id, content: parsed.data.content },
      });
      return { note, publication, mode: "created" as const };
    });

    revalidateNotePages(parsed.data.courseId);
    return {
      success: true,
      updatedAt: result.note.updatedAt.toISOString(),
      mode: result.mode,
      publication: {
        id: result.publication.id,
        content: result.publication.content,
      },
    };
  } catch (error) {
    console.error("Erro ao publicar anotações", error);
    return { success: false, error: "Não foi possível publicar suas anotações." };
  }
}

export async function deletePublishedStudyNote(input: unknown): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = studyNotePublicationIdentitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Anotação inválida." };

  try {
    const existing = await prisma.studyNote.findFirst({
      where: {
        lessonId: parsed.data.lessonId,
        courseId: parsed.data.courseId,
        course: { is: { userId: user.id } },
      },
      select: { id: true },
    });

    if (!existing) return { success: true, updatedAt: new Date().toISOString() };

    await prisma.studyNotePublication.deleteMany({
      where: {
        id: parsed.data.publicationId,
        studyNoteId: existing.id,
        studyNote: { is: { course: { is: { userId: user.id } } } },
      },
    });

    revalidateNotePages(parsed.data.courseId);
    return { success: true, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Erro ao apagar anotação publicada", error);
    return { success: false, error: "Não foi possível apagar a anotação publicada." };
  }
}
