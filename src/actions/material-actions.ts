"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToSupabaseStorage } from "@/lib/supabase-storage";

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
  const user = await requireUser();
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
    where: { id: courseId, kind: "COURSE", userId: user.id },
    select: { id: true },
  });
  if (!course) return { success: false, message: "Curso não encontrado." };

  const originalName = sanitizeFileName(file.name);
  const extension = path.extname(originalName).slice(0, 20);

  const dangerousExtensions = [
    ".html", ".htm", ".svg", ".xml",
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".php", ".phtml", ".php3", ".php4", ".php5", ".php7", ".phps",
    ".jsp", ".jspx", ".gsp", ".asp", ".aspx", ".asa", ".asax", ".ashx", ".asmx", ".axd",
    ".py", ".rb", ".pl", ".sh", ".cgi",
    ".exe", ".bat", ".cmd", ".msi", ".vbs", ".lnk"
  ];
  if (dangerousExtensions.includes(extension.toLowerCase())) {
    return { success: false, message: "Tipo de arquivo não permitido por motivos de segurança." };
  }

  const storedName = `${randomUUID()}${extension}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let publicUrl = await uploadToSupabaseStorage({
      path: `materials/${courseId}/${storedName}`,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    if (!publicUrl) {
      if (process.env.VERCEL) {
        return {
          success: false,
          message: "Configure o Supabase Storage para enviar materiais em produÃ§Ã£o.",
        };
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads", "materials", courseId);
      const uploadPath = path.join(uploadDir, storedName);
      publicUrl = `/uploads/materials/${courseId}/${storedName}`;

      await mkdir(uploadDir, { recursive: true });
      await writeFile(uploadPath, buffer);
    }

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
