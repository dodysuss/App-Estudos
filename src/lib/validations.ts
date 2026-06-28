import { z } from "zod";
import { extractYouTubePlaylistId, extractYouTubeVideoId } from "@/lib/youtube";
import { normalizeWebUrl } from "@/lib/web-url";

const optionalDescription = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(500, "Use no máximo 500 caracteres.").optional(),
);

const nameSchema = z.string().trim().min(1, "O nome é obrigatório.").max(120, "Use no máximo 120 caracteres.");

const optionalUrl = z.preprocess(
  normalizeWebUrl,
  z
    .string()
    .trim()
    .url("Informe uma URL válida.")
    .refine((value) => /^https?:\/\//i.test(value), "Use um endereço HTTP ou HTTPS.")
    .optional(),
);

const requiredPlaylistUrl = z.preprocess(
  normalizeWebUrl,
  z
    .string({ required_error: "Informe a URL da playlist." })
    .trim()
    .url("Informe uma URL válida.")
    .refine((value) => /^https?:\/\//i.test(value), "Use um endereço HTTP ou HTTPS.")
    .refine((value) => Boolean(extractYouTubePlaylistId(value)), "Informe uma URL válida de playlist do YouTube."),
);

const optionalSubject = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(80, "Use no máximo 80 caracteres.").optional(),
);

const tagsSchema = z.preprocess(
  (value) => typeof value === "string" ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : value,
  z.array(z.string().trim().min(1).max(30, "Cada tag pode ter no máximo 30 caracteres."))
    .max(20, "Use no máximo 20 tags.")
    .transform((tags) => [...new Set(tags)]),
);

const totalLessonsSchema = z.coerce
  .number({ invalid_type_error: "Informe a quantidade de itens." })
  .int("A quantidade deve ser um número inteiro.")
  .min(1, "Informe pelo menos um item.")
  .max(1000, "Use no máximo 1.000 itens.");

export const courseSchema = z.discriminatedUnion("kind", [
  z.object({
    name: nameSchema,
    description: optionalDescription,
    url: optionalUrl,
    kind: z.literal("COURSE"),
    subject: optionalSubject,
    tags: tagsSchema,
    totalLessons: totalLessonsSchema,
  }),
  z.object({
    name: nameSchema,
    description: optionalDescription,
    url: requiredPlaylistUrl,
    kind: z.literal("VIDEO_PLAYLIST"),
    subject: optionalSubject,
    tags: tagsSchema,
    totalLessons: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().int().min(1).max(1000).optional(),
    ),
  }),
]);

export const courseDetailsSchema = z.object({
  courseId: z.string().cuid(),
  name: nameSchema,
  description: optionalDescription,
  url: optionalUrl,
  subject: optionalSubject,
  tags: tagsSchema,
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

export const lessonTitleSchema = z.object({
  lessonId: z.string().cuid(),
  courseId: z.string().cuid(),
  title: z.string().trim().max(120, "Use no máximo 120 caracteres."),
});

export const lessonRatingSchema = z.object({
  lessonId: z.string().cuid(),
  courseId: z.string().cuid(),
  rating: z.number().int().min(0).max(5),
});

export const lessonPinnedSchema = z.object({
  lessonId: z.string().cuid(),
  courseId: z.string().cuid(),
  pinned: z.boolean(),
});

export const moduleCreateSchema = z.object({
  courseId: z.string().cuid(),
  name: z.string().trim().min(1, "Informe o nome do módulo.").max(80, "Use no máximo 80 caracteres."),
});

export const lessonModuleSchema = z.object({
  lessonId: z.string().cuid(),
  courseId: z.string().cuid(),
  moduleId: z.preprocess((value) => value === "" ? null : value, z.string().cuid().nullable()),
});

export const lessonOrderSchema = z.object({
  courseId: z.string().cuid(),
  lessons: z.array(z.object({
    id: z.string().cuid(),
    moduleId: z.string().cuid().nullable(),
    position: z.number().int().min(1),
  })).min(1),
});

export const moduleOrderSchema = z.object({
  courseId: z.string().cuid(),
  moduleIds: z.array(z.string().cuid()).min(1),
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

export const publishStudyNoteSchema = z
  .object({
    courseId: z.string().cuid(),
    lessonId: z.string().cuid(),
    publicationId: z.string().cuid().optional(),
    videoUrl: z.string().trim().max(500),
    content: z.string().trim().min(1, "Escreva uma anotação antes de publicar.").max(100_000, "A anotação está muito longa."),
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

export const studyNoteIdentitySchema = z.object({
  courseId: z.string().cuid(),
  lessonId: z.string().cuid(),
});

export const studyNotePublicationIdentitySchema = studyNoteIdentitySchema.extend({
  publicationId: z.string().cuid(),
});

export type CourseInput = z.infer<typeof courseSchema>;
