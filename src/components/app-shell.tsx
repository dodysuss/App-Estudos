"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AppShell({ currentUser, children }: { currentUser: CurrentUser; children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("app-estudos-sidebar-collapsed");
    if (stored) setSidebarCollapsed(stored === "1");
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("app-estudos-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      <Sidebar currentUser={currentUser} collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
      <Topbar currentUser={currentUser} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
      <main className={cn("min-h-[calc(100vh-4rem)] px-4 py-6 transition-[margin] duration-300 md:px-8 md:py-8", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
        {children}
      </main>
    </>
  );
}
