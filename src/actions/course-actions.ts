"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";

export type CourseFormState = {
  message?: string;
  errors?: Partial<Record<"name" | "url" | "totalLessons", string[]>>;
};

export async function createCourse(
  _previousState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const parsed = courseSchema.safeParse({
    name: formData.get("name"),
    url: formData.get("url"),
    totalLessons: formData.get("totalLessons"),
  });

  if (!parsed.success) {
    return { message: "Revise os campos destacados.", errors: parsed.error.flatten().fieldErrors };
  }

  let courseId: string;
  try {
    const course = await prisma.$transaction(async (transaction) => {
      const created = await transaction.course.create({ data: parsed.data });
      await transaction.lesson.createMany({
        data: Array.from({ length: parsed.data.totalLessons }, (_, index) => ({
          courseId: created.id,
          lessonNumber: index + 1,
        })),
      });
      return created;
    });
    courseId = course.id;
  } catch (error) {
    console.error("Erro ao criar curso", error);
    return { message: "Não foi possível criar o curso. Tente novamente." };
  }

  redirect(`/courses/${courseId}`);
}
