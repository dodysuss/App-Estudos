import { z } from "zod";
import { extractYouTubeVideoId } from "@/lib/youtube";

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url("Informe uma URL válida.").optional(),
);

export const courseSchema = z.object({
  name: z.string().trim().min(1, "O nome do curso é obrigatório.").max(120, "Use no máximo 120 caracteres."),
  url: optionalUrl,
  totalLessons: z.coerce
    .number({ invalid_type_error: "Informe a quantidade de aulas." })
    .int("A quantidade deve ser um número inteiro.")
    .min(1, "O curso deve ter pelo menos uma aula.")
    .max(1000, "Use no máximo 1.000 aulas."),
});

export const lessonToggleSchema = z.object({
  lessonId: z.string().cuid(),
  courseId: z.string().cuid(),
  completed: z.boolean(),
});

export const lessonNotesSchema = z.object({
  lessonId: z.string().cuid(),
  courseId: z.string().cuid(),
  notes: z.string().max(500, "Use no máximo 500 caracteres."),
});

export const studyNoteSchema = z
  .object({
    courseId: z.string().cuid(),
    lessonId: z.string().cuid(),
    videoUrl: z.string().trim().max(500),
    content: z.string().max(100_000, "A anotação está muito longa."),
  })
  .superRefine((value, context) => {
    if (value.videoUrl && !extractYouTubeVideoId(value.videoUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoUrl"],
        message: "Cole uma URL válida do YouTube.",
      });
    }
  });

export type CourseInput = z.infer<typeof courseSchema>;
