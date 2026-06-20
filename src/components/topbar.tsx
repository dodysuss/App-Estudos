"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:px-8 lg:ml-64">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button>
        <p className="hidden text-sm text-muted-foreground sm:block">Organize seus cursos e mantenha o foco.</p>
        <ThemeToggle />
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw] shadow-xl">
            <Sidebar mobile onNavigate={() => setOpen(false)} />
            <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
          </div>
        </div>
      )}
    </>
  );
}
