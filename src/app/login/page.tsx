import { redirect } from "next/navigation";
import { AuthCard, LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthCard title="Entrar" description="Acesse sua biblioteca de cursos, playlists, vídeos e anotações.">
      <LoginForm />
    </AuthCard>
  );
}
