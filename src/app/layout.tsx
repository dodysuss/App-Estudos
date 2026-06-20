import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "App de Estudos", template: "%s | App de Estudos" },
  description: "Acompanhe cursos, aulas, vídeos e anotações em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Sidebar />
          <Topbar />
          <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8 lg:ml-64">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
