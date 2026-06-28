"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const MAX_MATERIAL_SIZE = 50 * 1024 * 1024;

export type MaterialUploadState = {
  success?: boolean;
  message?: string;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "material";
}

export async function uploadCourseMaterial(
  _previousState: MaterialUploadState,
  formData: FormData,
): Promise<MaterialUploadState> {
  const courseId = String(formData.get("courseId") ?? "");
  const file = formData.get("material");

  if (!/^[a-z0-9]+$/i.test(courseId)) {
    return { success: false, message: "Curso inválido." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Selecione um arquivo para enviar." };
  }

  if (file.size > MAX_MATERIAL_SIZE) {
    return { success: false, message: "O arquivo deve ter no máximo 50 MB." };
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, kind: "COURSE" },
    select: { id: true },
  });
  if (!course) return { success: false, message: "Curso não encontrado." };

  const originalName = sanitizeFileName(file.name);
  const extension = path.extname(originalName).slice(0, 20);
  const storedName = `${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "materials", courseId);
  const uploadPath = path.join(uploadDir, storedName);
  const publicUrl = `/uploads/materials/${courseId}/${storedName}`;

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));
    await prisma.courseMaterial.create({
      data: {
        courseId,
        fileName: originalName,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url: publicUrl,
      },
    });

    revalidatePath(`/courses/${courseId}`);
    return { success: true, message: "Material didático enviado." };
  } catch (error) {
    console.error("Erro ao enviar material didático", error);
    return { success: false, message: "Não foi possível enviar o material." };
  }
}
