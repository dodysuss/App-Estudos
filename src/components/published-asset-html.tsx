"use client";

import { Braces, Code2, Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportableAsset = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  assetType: string;
  content: string;
  publishedAt: string | null;
  stages: Array<{
    id: string;
    title: string;
    content: string | null;
    position: number;
  }>;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ativo-digital";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToText(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  return document.body.innerText.trim();
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return Array.from(node.childNodes).map(nodeToMarkdown).join("");

  const children = () => Array.from(node.childNodes).map(nodeToMarkdown).join("").trim();
  const block = (value: string) => value ? `${value}\n\n` : "";

  switch (node.tagName.toLowerCase()) {
    case "h1":
      return block(`# ${children()}`);
    case "h2":
      return block(`## ${children()}`);
    case "h3":
      return block(`### ${children()}`);
    case "h4":
      return block(`#### ${children()}`);
    case "p":
      return block(children());
    case "strong":
    case "b":
      return `**${children()}**`;
    case "em":
    case "i":
      return `_${children()}_`;
    case "a": {
      const href = node.getAttribute("href") ?? "";
      return href ? `[${children() || href}](${href})` : children();
    }
    case "img": {
      const src = node.getAttribute("src") ?? "";
      const alt = node.getAttribute("alt") ?? "";
      return src ? `![${alt}](${src})\n\n` : "";
    }
    case "pre":
      return block(`\`\`\`\n${node.textContent?.trim() ?? ""}\n\`\`\``);
    case "code":
      return `\`${node.textContent ?? ""}\``;
    case "blockquote":
      return block(children().split("\n").map((line) => `> ${line}`).join("\n"));
    case "li":
      return `- ${children()}\n`;
    case "ul":
    case "ol":
      return `${Array.from(node.children).map(nodeToMarkdown).join("")}\n`;
    case "br":
      return "\n";
    case "hr":
      return "\n---\n\n";
    case "table":
      return block(htmlToText(node.outerHTML));
    default:
      return Array.from(node.childNodes).map(nodeToMarkdown).join("");
  }
}

function htmlToMarkdown(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  return Array.from(document.body.childNodes)
    .map(nodeToMarkdown)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildAssetText(asset: ExportableAsset) {
  const sections = [
    asset.title,
    asset.description,
    `Tipo: ${asset.assetType}`,
    asset.category ? `Categoria: ${asset.category}` : "",
    asset.tags.length ? `Tags: ${asset.tags.map((tag) => `#${tag}`).join(" ")}` : "",
    "",
    htmlToText(asset.content),
    ...asset.stages.flatMap((stage) => ["", `## ${stage.title}`, stage.content ? htmlToText(stage.content) : ""]),
  ];
  return sections.filter((section) => section !== null && section !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildAssetMarkdown(asset: ExportableAsset) {
  const sections = [
    `# ${asset.title}`,
    asset.description ?? "",
    `**Tipo:** ${asset.assetType}`,
    asset.category ? `**Categoria:** ${asset.category}` : "",
    asset.tags.length ? `**Tags:** ${asset.tags.map((tag) => `#${tag}`).join(" ")}` : "",
    "",
    htmlToMarkdown(asset.content),
    ...asset.stages.flatMap((stage) => ["", `## ${stage.title}`, stage.content ? htmlToMarkdown(stage.content) : ""]),
  ];
  return sections.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildAssetHtml(asset: ExportableAsset) {
  const stagesHtml = asset.stages
    .map((stage) => `<section><h2>${escapeHtml(stage.title)}</h2>${stage.content ?? ""}</section>`)
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(asset.title)}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; max-width: 880px; margin: 48px auto; padding: 0 24px; line-height: 1.7; color: #111827; }
    h1 { font-size: 2.75rem; line-height: 1.1; }
    h2 { margin-top: 2.5rem; }
    img, iframe { max-width: 100%; border-radius: 16px; }
    pre { overflow-x: auto; padding: 16px; border-radius: 16px; background: #0f172a; color: #f8fafc; }
    blockquote { border-left: 4px solid #4f46e5; margin-left: 0; padding-left: 16px; color: #475569; }
    .meta { color: #64748b; }
  </style>
</head>
<body>
  <h1>${escapeHtml(asset.title)}</h1>
  ${asset.description ? `<p class="meta">${escapeHtml(asset.description)}</p>` : ""}
  <p class="meta">Tipo: ${escapeHtml(asset.assetType)}${asset.category ? ` | Categoria: ${escapeHtml(asset.category)}` : ""}</p>
  ${asset.tags.length ? `<p class="meta">${asset.tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
  <main>${asset.content}</main>
  ${stagesHtml}
</body>
</html>`;
}

function downloadFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ExportAssetButtons({ asset }: { asset: ExportableAsset }) {
  const filename = slugify(asset.title);

  function exportJson() {
    downloadFile(`${filename}.json`, "application/json;charset=utf-8", JSON.stringify(asset, null, 2));
  }

  function exportMarkdown() {
    downloadFile(`${filename}.md`, "text/markdown;charset=utf-8", buildAssetMarkdown(asset));
  }

  function exportHtml() {
    downloadFile(`${filename}.html`, "text/html;charset=utf-8", buildAssetHtml(asset));
  }

  function exportTxt() {
    downloadFile(`${filename}.txt`, "text/plain;charset=utf-8", buildAssetText(asset));
  }

  return (
    <div className="flex flex-wrap gap-2 no-print">
      <Button type="button" variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white" onClick={exportMarkdown}>
        <Download className="h-4 w-4" />
        Markdown
      </Button>
      <Button type="button" variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        PDF
      </Button>
      <Button type="button" variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white" onClick={exportHtml}>
        <Code2 className="h-4 w-4" />
        HTML
      </Button>
      <Button type="button" variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white" onClick={exportJson}>
        <Braces className="h-4 w-4" />
        JSON
      </Button>
      <Button type="button" variant="secondary" size="sm" className="bg-white/90 text-slate-950 hover:bg-white" onClick={exportTxt}>
        <FileText className="h-4 w-4" />
        TXT
      </Button>
    </div>
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
