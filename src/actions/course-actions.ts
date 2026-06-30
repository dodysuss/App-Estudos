"use server";

import { rm } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readCourseFormValues, type CourseFormValues } from "@/lib/course-form-values";
import { courseDetailsSchema, courseIdentitySchema, courseSchema, playlistVideoSchema, refreshPlaylistSchema } from "@/lib/validations";
import { importYouTubePlaylistVideos } from "@/lib/youtube-playlist";
import { requireUser } from "@/lib/auth";
import { extractYouTubePlaylistId, extractYouTubeVideoId } from "@/lib/youtube";

export type CourseFormState = {
  message?: string;
  errors?: Partial<Record<"name" | "description" | "url" | "totalLessons" | "subject" | "tags" | "folderId", string[]>>;
  values?: CourseFormValues;
};

export type CourseMutationResult = { success: true } | { success: false; error: string };

export type RefreshPlaylistResult =
  | { success: true; added: number; total: number }
  | { success: false; error: string };

export type AddPlaylistVideoResult =
  | { success: true; lessonId: string; total: number }
  | { success: false; error: string };

function revalidateCollection(courseId?: string) {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/playlists");
  revalidatePath("/notes");
  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/playlists/${courseId}`);
    revalidatePath(`/courses/${courseId}/notes`);
  }
}

async function assertFolderForUser(userId: string, folderId: string | undefined, scope: "COURSE" | "VIDEO_PLAYLIST") {
  if (!folderId) return;
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId, scope },
    select: { id: true },
  });
  if (!folder) throw new Error("Pasta inválida para esta área.");
}

export async function createCourse(
  _previousState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const user = await requireUser();
  const values = readCourseFormValues(formData);
  const parsed = courseSchema.safeParse(values);

  if (!parsed.success) {
    return { message: "Revise os campos destacados.", errors: parsed.error.flatten().fieldErrors, values };
  }

  let courseId: string;

  try {
    if (parsed.data.kind === "VIDEO_PLAYLIST") {
      const playlistData = parsed.data;
      await assertFolderForUser(user.id, playlistData.folderId, "VIDEO_PLAYLIST");
      const videos = await importYouTubePlaylistVideos(playlistData.url);
      const course = await prisma.$transaction(async (transaction) => {
        const created = await transaction.course.create({
          data: {
            userId: user.id,
            name: playlistData.name,
            description: playlistData.description ?? null,
            url: playlistData.url,
            kind: playlistData.kind,
            folderId: playlistData.folderId ?? null,
            subject: playlistData.subject ?? null,
            tags: playlistData.tags,
            totalLessons: videos.length,
          },
        });

        for (const [index, video] of videos.entries()) {
          const lesson = await transaction.lesson.create({
            data: {
              courseId: created.id,
              lessonNumber: index + 1,
              position: index + 1,
              title: video.title,
            },
          });

          await transaction.studyNote.create({
            data: {
              courseId: created.id,
              lessonId: lesson.id,
              videoUrl: video.videoUrl,
              videoId: video.videoId,
            },
          });
        }

        return created;
      });
      courseId = course.id;
    } else {
      const courseData = parsed.data;
      await assertFolderForUser(user.id, courseData.folderId, "COURSE");
      const course = await prisma.$transaction(async (transaction) => {
        const created = await transaction.course.create({
          data: {
            ...courseData,
            userId: user.id,
            description: courseData.description ?? null,
          },
        });
        await transaction.lesson.createMany({
          data: Array.from({ length: courseData.totalLessons }, (_, index) => ({
            courseId: created.id,
            lessonNumber: index + 1,
            position: index + 1,
          })),
        });
        return created;
      });
      courseId = course.id;
    }
  } catch (error) {
    console.error("Erro ao criar curso", error);
    const message = error instanceof Error ? error.message : "Não foi possível criar o item. Tente novamente.";
    return {
      message,
      errors: parsed.data.kind === "VIDEO_PLAYLIST" ? { url: [message] } : undefined,
      values,
    };
  }

  redirect(parsed.data.kind === "VIDEO_PLAYLIST" ? `/playlists/${courseId}` : `/courses/${courseId}`);
}

export async function updateCourseDetails(input: unknown): Promise<CourseMutationResult> {
  const user = await requireUser();
  const parsed = courseDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados do curso inválidos." };
  }

  try {
    const existing = await prisma.course.findFirst({
      where: { id: parsed.data.courseId, userId: user.id },
      select: { id: true, kind: true },
    });
    if (!existing) return { success: false, error: "Item não encontrado." };
    if (existing.kind === "VIDEO_PLAYLIST" && parsed.data.url && !extractYouTubePlaylistId(parsed.data.url)) {
      return { success: false, error: "Informe uma URL válida de playlist do YouTube." };
    }

    const updated = await prisma.course.updateMany({
      where: { id: parsed.data.courseId, userId: user.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        url: parsed.data.url ?? null,
        subject: parsed.data.subject ?? null,
        tags: parsed.data.tags,
      },
    });
    if (updated.count === 0) return { success: false, error: "Item não encontrado." };
    revalidateCollection(parsed.data.courseId);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar item", error);
    return { success: false, error: "Não foi possível atualizar este item." };
  }
}

export async function deleteCourse(input: unknown): Promise<CourseMutationResult> {
  const user = await requireUser();
  const parsed = courseIdentitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Item inválido." };

  try {
    const course = await prisma.course.findFirst({
      where: { id: parsed.data.courseId, userId: user.id },
      select: { id: true, kind: true },
    });
    if (!course) return { success: false, error: "Item não encontrado." };

    await prisma.course.deleteMany({ where: { id: course.id, userId: user.id } });

    if (course.kind === "COURSE") {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "materials", course.id);
      await rm(uploadDir, { recursive: true, force: true }).catch(() => undefined);
    }

    revalidateCollection(course.id);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir item", error);
    return { success: false, error: "Não foi possível excluir este item." };
  }
}

export async function refreshPlaylistVideos(input: unknown): Promise<RefreshPlaylistResult> {
  const user = await requireUser();
  const parsed = refreshPlaylistSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Playlist inválida." };

  try {
    const playlist = await prisma.course.findFirst({
      where: { id: parsed.data.courseId, kind: "VIDEO_PLAYLIST", userId: user.id },
      select: { id: true, url: true },
    });
    if (!playlist) return { success: false, error: "Playlist não encontrada." };
    if (!playlist.url) return { success: false, error: "Informe a URL da playlist antes de atualizar os vídeos." };

    const importedVideos = await importYouTubePlaylistVideos(playlist.url);

    const result = await prisma.$transaction(async (transaction) => {
      const lessons = await transaction.lesson.findMany({
        where: { courseId: playlist.id },
        orderBy: [{ position: "asc" }, { lessonNumber: "asc" }],
        include: { studyNotes: { take: 1 } },
      });

      const existingByVideoId = new Map<string, { lessonId: string; noteId?: string }>();
      for (const lesson of lessons) {
        const note = lesson.studyNotes[0];
        if (note?.videoId) existingByVideoId.set(note.videoId, { lessonId: lesson.id, noteId: note.id });
      }

      let nextLessonNumber = Math.max(0, ...lessons.map((lesson) => lesson.lessonNumber)) + 1;
      let nextPosition = Math.max(0, ...lessons.map((lesson) => lesson.position)) + 1;
      let added = 0;

      for (const video of importedVideos) {
        const existing = existingByVideoId.get(video.videoId);
        if (existing) {
          if (existing.noteId) {
            await transaction.studyNote.update({
              where: { id: existing.noteId },
              data: { videoUrl: video.videoUrl, videoId: video.videoId },
            });
          }
          continue;
        }

        const lesson = await transaction.lesson.create({
          data: {
            courseId: playlist.id,
            lessonNumber: nextLessonNumber,
            position: nextPosition,
            title: video.title,
          },
        });

        await transaction.studyNote.create({
          data: {
            courseId: playlist.id,
            lessonId: lesson.id,
            videoUrl: video.videoUrl,
            videoId: video.videoId,
          },
        });

        existingByVideoId.set(video.videoId, { lessonId: lesson.id });
        nextLessonNumber += 1;
        nextPosition += 1;
        added += 1;
      }

      const total = await transaction.lesson.count({ where: { courseId: playlist.id } });
      await transaction.course.update({
        where: { id: playlist.id },
        data: { totalLessons: total },
      });

      return { added, total };
    });

    revalidateCollection(playlist.id);
    return { success: true, added: result.added, total: result.total };
  } catch (error) {
    console.error("Erro ao atualizar playlist", error);
    const message = error instanceof Error ? error.message : "Não foi possível atualizar a playlist.";
    return { success: false, error: message };
  }
}

export async function addPlaylistVideo(input: unknown): Promise<AddPlaylistVideoResult> {
  const user = await requireUser();
  const parsed = playlistVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Vídeo inválido." };
  }

  const videoId = extractYouTubeVideoId(parsed.data.videoUrl);
  if (!videoId) return { success: false, error: "Cole uma URL válida de vídeo do YouTube." };

  try {
    const playlist = await prisma.course.findFirst({
      where: { id: parsed.data.courseId, kind: "VIDEO_PLAYLIST", userId: user.id },
      select: { id: true },
    });
    if (!playlist) return { success: false, error: "Playlist não encontrada." };

    const duplicate = await prisma.studyNote.findFirst({
      where: {
        courseId: playlist.id,
        videoId,
        course: { is: { userId: user.id, kind: "VIDEO_PLAYLIST" } },
      },
      select: { id: true },
    });
    if (duplicate) return { success: false, error: "Este vídeo já está nesta playlist." };

    const result = await prisma.$transaction(async (transaction) => {
      const lastLesson = await transaction.lesson.findFirst({
        where: { courseId: playlist.id },
        orderBy: [{ lessonNumber: "desc" }],
        select: { lessonNumber: true },
      });
      const lastPosition = await transaction.lesson.findFirst({
        where: { courseId: playlist.id },
        orderBy: [{ position: "desc" }],
        select: { position: true },
      });

      const nextLessonNumber = (lastLesson?.lessonNumber ?? 0) + 1;
      const nextPosition = (lastPosition?.position ?? 0) + 1;
      const title = parsed.data.title?.trim() || `Vídeo ${nextLessonNumber}`;

      const lesson = await transaction.lesson.create({
        data: {
          courseId: playlist.id,
          lessonNumber: nextLessonNumber,
          position: nextPosition,
          title,
        },
      });

      await transaction.studyNote.create({
        data: {
          courseId: playlist.id,
          lessonId: lesson.id,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          videoId,
        },
      });

      const total = await transaction.lesson.count({ where: { courseId: playlist.id } });
      await transaction.course.update({
        where: { id: playlist.id },
        data: { totalLessons: total },
      });

      return { lessonId: lesson.id, total };
    });

    revalidateCollection(playlist.id);
    return { success: true, lessonId: result.lessonId, total: result.total };
  } catch (error) {
    console.error("Erro ao adicionar vídeo manual", error);
    return { success: false, error: "Não foi possível adicionar o vídeo." };
  }
}
