"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readCourseFormValues, type CourseFormValues } from "@/lib/course-form-values";
import { courseDetailsSchema, courseSchema } from "@/lib/validations";
import { importYouTubePlaylistVideos } from "@/lib/youtube-playlist";

export type CourseFormState = {
  message?: string;
  errors?: Partial<Record<"name" | "description" | "url" | "totalLessons" | "subject" | "tags", string[]>>;
  values?: CourseFormValues;
};

export async function createCourse(
  _previousState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const values = readCourseFormValues(formData);
  const parsed = courseSchema.safeParse(values);

  if (!parsed.success) {
    return { message: "Revise os campos destacados.", errors: parsed.error.flatten().fieldErrors, values };
  }

  let courseId: string;

  try {
    if (parsed.data.kind === "VIDEO_PLAYLIST") {
      const playlistData = parsed.data;
      const videos = await importYouTubePlaylistVideos(playlistData.url);
      const course = await prisma.$transaction(async (transaction) => {
        const created = await transaction.course.create({
          data: {
            name: playlistData.name,
            description: playlistData.description ?? null,
            url: playlistData.url,
            kind: playlistData.kind,
            subject: null,
            tags: [],
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
      const course = await prisma.$transaction(async (transaction) => {
        const created = await transaction.course.create({ data: { ...courseData, description: courseData.description ?? null } });
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

export type CourseMutationResult = { success: true } | { success: false; error: string };

export async function updateCourseDetails(input: unknown): Promise<CourseMutationResult> {
  const parsed = courseDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados do curso inválidos." };
  }

  try {
    const updated = await prisma.course.updateMany({
      where: { id: parsed.data.courseId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        url: parsed.data.url ?? null,
        subject: parsed.data.subject ?? null,
        tags: parsed.data.tags,
      },
    });
    if (updated.count === 0) return { success: false, error: "Curso não encontrado." };
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/playlists");
    revalidatePath(`/courses/${parsed.data.courseId}`);
    revalidatePath(`/playlists/${parsed.data.courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar curso", error);
    return { success: false, error: "Não foi possível atualizar o curso." };
  }
}
