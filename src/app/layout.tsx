import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { getCurrentUser } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "App de Estudos", template: "%s | App de Estudos" },
  description: "Acompanhe cursos, aulas, vídeos e anotações em um só lugar.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider>
          {user ? (
            <AppShell currentUser={user}>{children}</AppShell>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
