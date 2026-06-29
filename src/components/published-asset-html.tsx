"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportPdfButton() {
  return (
    <Button type="button" variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white no-print" onClick={() => window.print()}>
      <Download className="h-4 w-4" />
      Exportar PDF
    </Button>
  );
}

export function PublishedAssetHtml({ html }: { html: string }) {
  async function copyCodeFromButton(button: HTMLButtonElement) {
    const block = button.closest(".asset-code-block");
    const code = block?.querySelector("code")?.textContent ?? "";
    if (!code.trim()) return;
    await navigator.clipboard.writeText(code);
    const previous = button.textContent;
    button.textContent = "Copiado";
    window.setTimeout(() => {
      button.textContent = previous || "Copiar";
    }, 1200);
  }

  return (
    <div
      className="asset-html-page"
      onClick={(event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.matches("[data-copy-code]")) {
          void copyCodeFromButton(target);
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
