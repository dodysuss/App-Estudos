"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { createUserSession, destroyCurrentSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations";

type AuthField = "name" | "email" | "password" | "confirmPassword";

export type AuthFormState = {
  message?: string;
  errors?: Partial<Record<AuthField, string[]>>;
  values?: {
    name?: string;
    email?: string;
  };
};

function readAuthValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}

function publicValues(values: { name?: string; email?: string }) {
  return {
    name: values.name ?? "",
    email: values.email ?? "",
  };
}

export async function registerUser(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = readAuthValues(formData);
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Revise os campos destacados.",
      errors: parsed.error.flatten().fieldErrors,
      values: publicValues(values),
    };
  }

  let userId: string;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const existingUsers = await transaction.user.count();
      const user = await transaction.user.create({
        data: {
          name: parsed.data.name ?? null,
          email: parsed.data.email,
          passwordHash: await hashPassword(parsed.data.password),
        },
        select: { id: true },
      });

      if (existingUsers === 0) {
        await transaction.course.updateMany({
          where: { userId: null },
          data: { userId: user.id },
        });
      }

      return user;
    });

    userId = result.id;
    await createUserSession(userId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: "Este e-mail já está cadastrado.",
        errors: { email: ["Este e-mail já está cadastrado."] },
        values: publicValues(values),
      };
    }

    console.error("Erro ao cadastrar usuário", error);
    return {
      message: "Não foi possível criar sua conta. Tente novamente.",
      values: publicValues(values),
    };
  }

  redirect("/");
}

export async function loginUser(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = readAuthValues(formData);
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Revise os campos destacados.",
      errors: parsed.error.flatten().fieldErrors,
      values: publicValues(values),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return {
      message: "E-mail ou senha inválidos.",
      errors: { password: ["Confira sua senha e tente novamente."] },
      values: publicValues(values),
    };
  }

  await createUserSession(user.id);
  redirect("/");
}

export async function logoutUser() {
  await destroyCurrentSession();
  redirect("/login");
}
