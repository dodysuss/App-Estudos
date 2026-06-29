import { redirect } from "next/navigation";
import { AuthCard, RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Cadastro" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthCard title="Criar conta" description="Crie seu acesso para manter seus estudos separados dos demais usuários.">
      <RegisterForm />
    </AuthCard>
  );
}
