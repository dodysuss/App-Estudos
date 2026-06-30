"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ChevronDown,
  Code2,
  Eraser,
  FileText,
  Globe2,
  Highlighter,
  ImageIcon,
  Italic,
  Layers3,
  LinkIcon,
  List,
  ListOrdered,
  LockKeyhole,
  Minus,
  PaintBucket,
  Paperclip,
  Pilcrow,
  Quote,
  Redo2,
  Rows3,
  SeparatorHorizontal,
  Table2,
  Type,
  Underline,
  Undo2,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InsertKind =
  | "checklist"
  | "code"
  | "secret"
  | "table"
  | "callout"
  | "link"
  | "document"
  | "image"
  | "youtube"
  | "embed"
  | "attachment"
  | "divider"
  | "accordion"
  | "nested-card"
  | "internal-link"
  | "prompt-model"
  | "code-model"
  | "link-model"
  | "link-list"
  | "hack-model"
  | "digital-asset-model"
  | "skill-model";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
};

type SpecialFieldKey =
  | "aiModel"
  | "objective"
  | "variables"
  | "expectedResult"
  | "example"
  | "language"
  | "usage"
  | "dependencies"
  | "command"
  | "codeBlocks"
  | "linkText"
  | "source"
  | "observations"
  | "listName"
  | "urls"
  | "problem"
  | "steps"
  | "tools"
  | "difficulty"
  | "assetType"
  | "file"
  | "license"
  | "origin"
  | "skillType"
  | "instructions";

type InsertDraft = {
  title?: string;
  body?: string;
  caption?: string;
  url?: string;
  rows?: string;
  cols?: string;
  fields?: Partial<Record<SpecialFieldKey, string>>;
};

type ModalState = {
  open: boolean;
  kind: InsertKind;
  mode: "insert" | "edit";
  draft?: InsertDraft;
};

const FONT_FAMILIES = [
  { label: "Texto", value: "Inter, Arial, sans-serif" },
  { label: "Serifada", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'JetBrains Mono', 'Fira Code', Consolas, monospace" },
];

const SIZE_LABELS = [
  { label: "Pequeno", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Grande", value: "5" },
  { label: "Título", value: "7" },
];

const LINE_HEIGHTS = [
  { label: "Entrelinha", value: "" },
  { label: "1.0", value: "1" },
  { label: "1.4", value: "1.4" },
  { label: "1.6", value: "1.6" },
  { label: "1.8", value: "1.8" },
  { label: "2.0", value: "2" },
];

const COLOR_PALETTE = ["#111827", "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];
const HIGHLIGHT_PALETTE = ["#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3", "#ede9fe", "#e0f2fe", "#fee2e2", "#f3f4f6"];

const INSERT_OPTIONS: Array<{ kind: InsertKind; label: string; icon: typeof CheckSquare }> = [
  { kind: "checklist", label: "Checklist", icon: CheckSquare },
  { kind: "accordion", label: "Lista recolhível", icon: ChevronDown },
  { kind: "code", label: "Código", icon: Code2 },
  { kind: "prompt-model", label: "Prompt", icon: Type },
  { kind: "code-model", label: "Código estruturado", icon: Code2 },
  { kind: "link-model", label: "Link estruturado", icon: LinkIcon },
  { kind: "link-list", label: "Lista de links", icon: List },
  { kind: "hack-model", label: "Hack", icon: Highlighter },
  { kind: "digital-asset-model", label: "Ativo digital", icon: Layers3 },
  { kind: "skill-model", label: "Skill", icon: FileText },
  { kind: "youtube", label: "YouTube", icon: Video },
  { kind: "embed", label: "Página externa", icon: Globe2 },
  { kind: "attachment", label: "Anexo", icon: Paperclip },
  { kind: "nested-card", label: "Card interno", icon: Layers3 },
  { kind: "internal-link", label: "Link interno", icon: LinkIcon },
  { kind: "secret", label: "Segredo", icon: LockKeyhole },
  { kind: "table", label: "Tabela", icon: Table2 },
  { kind: "callout", label: "Destaque", icon: Highlighter },
  { kind: "link", label: "Link", icon: LinkIcon },
  { kind: "document", label: "Documento", icon: FileText },
  { kind: "image", label: "Imagem", icon: ImageIcon },
  { kind: "divider", label: "Divisor", icon: SeparatorHorizontal },
];

const SPECIAL_FIELD_LABELS: Record<SpecialFieldKey, { label: string; placeholder?: string; multiline?: boolean; full?: boolean }> = {
  aiModel: { label: "Modelo de IA recomendado", placeholder: "Ex.: GPT-5, Claude, Gemini" },
  objective: { label: "Objetivo do prompt", multiline: true },
  variables: { label: "Variáveis de entrada", placeholder: "Ex.: {{tema}}, {{publico}}, {{tom}}", multiline: true },
  expectedResult: { label: "Resultado esperado", multiline: true },
  example: { label: "Exemplo de uso", multiline: true },
  language: { label: "Linguagem", placeholder: "Ex.: TypeScript, Python, SQL" },
  usage: { label: "Descrição do uso", multiline: true },
  dependencies: { label: "Dependências", multiline: true },
  command: { label: "Comando de execução", placeholder: "Ex.: npm run dev" },
  codeBlocks: { label: "Blocos de código copiáveis", multiline: true, full: true },
  linkText: { label: "Texto do link", placeholder: "Texto visível" },
  source: { label: "Fonte" },
  observations: { label: "Observações", multiline: true },
  listName: { label: "Nome da lista" },
  urls: { label: "URLs", placeholder: "Uma URL por linha. Opcional: Texto | URL | Observação", multiline: true, full: true },
  problem: { label: "Problema resolvido", multiline: true },
  steps: { label: "Passo a passo", placeholder: "Um passo por linha", multiline: true, full: true },
  tools: { label: "Ferramentas necessárias", multiline: true },
  difficulty: { label: "Nível de dificuldade", placeholder: "Ex.: Fácil, Médio, Avançado" },
  assetType: { label: "Tipo de ativo" },
  file: { label: "Arquivo anexado", placeholder: "URL ou referência do arquivo" },
  license: { label: "Licença" },
  origin: { label: "Origem" },
  skillType: { label: "Tipo" },
  instructions: { label: "Instruções", multiline: true, full: true },
};

const SPECIAL_MODEL_FIELDS: Partial<Record<InsertKind, SpecialFieldKey[]>> = {
  "prompt-model": ["aiModel", "objective", "variables", "expectedResult", "example"],
  "code-model": ["language", "usage", "dependencies", "command", "codeBlocks"],
  "link-model": ["linkText", "source", "observations"],
  "link-list": ["listName", "urls", "observations"],
  "hack-model": ["problem", "steps", "observations", "tools", "difficulty"],
  "digital-asset-model": ["assetType", "file", "license", "origin", "observations"],
  "skill-model": ["skillType", "file", "instructions", "origin", "observations"],
};

const SPECIAL_MODEL_TITLES: Partial<Record<InsertKind, string>> = {
  "prompt-model": "Prompt",
  "code-model": "Código",
  "link-model": "Link",
  "link-list": "Lista de links",
  "hack-model": "Hack",
  "digital-asset-model": "Ativo digital",
  "skill-model": "Skill",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractYouTubeVideoId(value: string) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;

      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0]) && parts[1]) return parts[1];
    }

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
  } catch {
    const match = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    return match?.[1] ?? "";
  }

  return "";
}

function toolbarButtonClass(active?: boolean) {
  return `inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
    active ? "border-primary bg-primary text-primary-foreground" : "bg-background/80 hover:bg-accent"
  }`;
}

function getTextStats(text: string) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  return {
    words: cleanText ? cleanText.split(" ").length : 0,
    chars: text.replace(/\s/g, "").length,
  };
}

function isInsertKind(value: string | undefined): value is InsertKind {
  return Boolean(value && INSERT_OPTIONS.some((option) => option.kind === value));
}

function readBlockDraft(block: HTMLElement, kind: InsertKind): InsertDraft {
  const title = block.querySelector<HTMLElement>("[data-block-title]")?.textContent?.trim() ?? "";
  const caption = block.querySelector<HTMLElement>("[data-block-caption]")?.textContent?.trim() ?? "";
  const body =
    block.querySelector<HTMLElement>("[data-block-body]")?.textContent?.trim() ??
    block.querySelector("code")?.textContent?.trim() ??
    "";
  const url =
    block.getAttribute("data-url") ??
    block.querySelector("iframe")?.getAttribute("src") ??
    block.querySelector("a")?.getAttribute("href") ??
    block.querySelector("img")?.getAttribute("src") ??
    "";

  const fields = Object.fromEntries(
    Array.from(block.querySelectorAll<HTMLElement>("[data-special-field]"))
      .map((field) => [field.dataset.specialField ?? "", field.textContent?.trim() ?? ""])
      .filter(([key]) => Boolean(key)),
  ) as Partial<Record<SpecialFieldKey, string>>;

  if (kind === "link-list") {
    fields.urls = Array.from(block.querySelectorAll("li"))
      .map((item) => {
        const link = item.querySelector("a");
        const text = link?.textContent?.trim() ?? "";
        const href = link?.getAttribute("href") ?? "";
        const note = item.querySelector("small")?.textContent?.trim() ?? link?.getAttribute("title") ?? "";
        return [text, href, note].filter(Boolean).join(" | ");
      })
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "hack-model") {
    fields.steps = Array.from(block.querySelectorAll<HTMLElement>("[data-special-field='steps']"))
      .map((item) => item.textContent?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "code-model") {
    fields.codeBlocks = block.querySelector("code")?.textContent?.trim() ?? fields.codeBlocks ?? "";
  }

  if (SPECIAL_MODEL_FIELDS[kind]) {
    return { title, body, caption, url, fields };
  }

  if (kind === "checklist") {
    const checklistBody = Array.from(block.querySelectorAll("li"))
      .map((item) => {
        const itemTitle = item.querySelector<HTMLElement>("[data-check-title]")?.textContent?.trim() ?? "";
        const itemDetail = item.querySelector<HTMLElement>("[data-check-detail]")?.textContent?.trim() ?? "";
        return itemDetail ? `${itemTitle} | ${itemDetail}` : itemTitle;
      })
      .filter(Boolean)
      .join("\n");
    return { title, body: checklistBody };
  }

  if (kind === "accordion") {
    return { title, body, caption };
  }

  if (kind === "table") {
    const rows = String(block.querySelectorAll("tbody tr").length || 3);
    const cols = String(block.querySelectorAll("thead th").length || 3);
    return { title, rows, cols };
  }

  return { title, body, caption, url };
}

function InsertContentModal({
  open,
  kind,
  mode,
  draft,
  onClose,
  onInsert,
}: {
  open: boolean;
  kind: InsertKind;
  mode: "insert" | "edit";
  draft?: InsertDraft;
  onClose: () => void;
  onInsert: (html: string) => void;
}) {
  const [selectedKind, setSelectedKind] = useState<InsertKind>(kind);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");
  const [fieldValues, setFieldValues] = useState<Partial<Record<SpecialFieldKey, string>>>({});

  useEffect(() => {
    if (!open) return;
    setSelectedKind(kind);
    setTitle(draft?.title ?? "");
    setBody(draft?.body ?? "");
    setCaption(draft?.caption ?? "");
    setUrl(draft?.url ?? "");
    setRows(draft?.rows ?? "3");
    setCols(draft?.cols ?? "3");
    setFieldValues(draft?.fields ?? {});
  }, [draft, kind, open]);

  if (!open) return null;

  function buildHtml() {
    const safeTitle = escapeHtml(title.trim());
    const safeBody = escapeHtml(body.trim());
    const safeCaption = escapeHtml(caption.trim());
    const safeUrl = escapeHtml(normalizeUrl(url));
    const safeLabel = safeTitle || "Novo conteúdo";

    const specialFields = SPECIAL_MODEL_FIELDS[selectedKind] ?? [];
    const specialTitle = SPECIAL_MODEL_TITLES[selectedKind] ?? "Modelo de dados";
    const fieldValue = (key: SpecialFieldKey) => escapeHtml((fieldValues[key] ?? "").trim());
    const fieldRows = (keys: SpecialFieldKey[]) =>
      keys
        .filter((key) => fieldValue(key) || key === "steps" || key === "codeBlocks" || key === "urls" || key === "instructions")
        .map((key) => {
          const label = SPECIAL_FIELD_LABELS[key].label;
          const value = fieldValue(key);
          if (key === "steps") {
            const items = (fieldValues.steps ?? "")
              .split(/\r?\n/)
              .map((step) => step.trim())
              .filter(Boolean)
              .map((step) => `<li data-special-field="steps">${escapeHtml(step)}</li>`)
              .join("");
            return `<div class="asset-data-field asset-data-field-full"><strong>${label}</strong><ol>${items || "<li data-special-field=\"steps\">Adicionar passo</li>"}</ol></div>`;
          }
          if (key === "instructions") {
            return `<div class="asset-data-field asset-data-field-full"><strong>${label}</strong><pre data-special-field="${key}">${value || ""}</pre></div>`;
          }
          return `<div class="asset-data-field ${SPECIAL_FIELD_LABELS[key].full ? "asset-data-field-full" : ""}"><strong>${label}</strong><p data-special-field="${key}">${value || ""}</p></div>`;
        })
        .join("");

    if (specialFields.length) {
      if (selectedKind === "code-model") {
        const code = fieldValue("codeBlocks") || safeBody || "// cole seu código aqui";
        return `<div class="asset-insert-block asset-data-model asset-code-model" data-kind="code-model"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Código"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<div class="asset-data-kicker">${specialTitle}</div><div class="asset-data-fields">${fieldRows(["language", "usage", "dependencies", "command"])}</div><div class="asset-code-block"><div class="asset-code-header" contenteditable="false"><span>${fieldValue("language") || "Código"}</span><div><button type="button" data-copy-code>Copiar</button></div></div><pre><code data-special-field="codeBlocks">${code}</code></pre></div></div><p><br></p>`;
      }

      if (selectedKind === "link-model") {
        const href = safeUrl || "#";
        const text = fieldValue("linkText") || safeLabel || href;
        return `<div class="asset-insert-block asset-data-model asset-link-model" data-kind="link-model" data-url="${href}"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Link"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<a class="asset-special-link" href="${href}" target="_blank" rel="noopener noreferrer">${text}</a><div class="asset-data-fields">${fieldRows(["source", "observations"])}</div></div><p><br></p>`;
      }

      if (selectedKind === "link-list") {
        const links = (fieldValues.urls ?? "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [rawText, rawUrl, rawNote] = line.includes("|") ? line.split("|").map((part) => part.trim()) : [line, line, ""];
            const href = escapeHtml(normalizeUrl(rawUrl || rawText));
            const text = escapeHtml(rawText || href);
            const note = escapeHtml(rawNote || fieldValues.observations || "");
            return `<li><a href="${href || "#"}" target="_blank" rel="noopener noreferrer" title="${note}">${text}</a>${note ? `<small data-special-field="observations">${note}</small>` : ""}</li>`;
          })
          .join("");
        return `<div class="asset-insert-block asset-data-model asset-link-list-model" data-kind="link-list"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || fieldValue("listName") || "Lista de links"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<p class="asset-data-kicker" data-special-field="listName">${fieldValue("listName") || "Lista de links"}</p><ul class="asset-special-link-list" data-special-field="urls">${links || "<li>Adicione URLs no editor do bloco</li>"}</ul></div><p><br></p>`;
      }

      return `<div class="asset-insert-block asset-data-model" data-kind="${selectedKind}"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || specialTitle}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<div class="asset-data-kicker">${specialTitle}</div><div class="asset-data-fields">${fieldRows(specialFields)}</div></div><p><br></p>`;
    }

    if (selectedKind === "checklist") {
      const items = (body.trim() || "Tarefa 1 | detalhe opcional\nTarefa 2 | detalhe opcional")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const [itemTitle, ...details] = item.split("|").map((part) => part.trim());
          const detail = details.join(" | ");
          return `<li><input type="checkbox"><span><strong data-check-title>${escapeHtml(itemTitle || "Item")}</strong>${detail ? `<small data-check-detail>${escapeHtml(detail)}</small>` : ""}</span></li>`;
        })
        .join("");

      return `<div class="asset-insert-block asset-checklist-block" data-kind="checklist"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Checklist"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<ul class="asset-checklist">${items}</ul></div><p><br></p>`;
    }

    if (selectedKind === "accordion") {
      return `<div class="asset-insert-block asset-accordion-block" data-kind="accordion"><div class="asset-block-actions" contenteditable="false"><strong>Lista recolhível</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<details class="asset-accordion"><summary data-block-title>${safeTitle || "Título da lista"}</summary><div data-block-body>${safeBody || "Conteúdo interno da lista recolhível."}</div></details></div><p><br></p>`;
    }

    if (selectedKind === "code") {
      return `<div class="asset-insert-block asset-code-block" data-kind="code"><div class="asset-code-header" contenteditable="false"><span data-block-title>${safeTitle || "Bloco de código"}</span><div><button type="button" data-edit-block>Editar</button><button type="button" data-copy-code>Copiar</button></div></div>${safeCaption ? `<p class="asset-code-caption" data-block-caption>${safeCaption}</p>` : ""}<pre><code data-block-body>${safeBody || "// cole seu código aqui"}</code></pre></div><p><br></p>`;
    }

    if (selectedKind === "secret") {
      return `<div class="asset-insert-block asset-secret-block" data-kind="secret"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Segredo"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<details class="asset-secret"><summary>Mostrar conteúdo protegido</summary><pre data-block-body>${safeBody || "Senha, token ou código API"}</pre></details></div><p><br></p>`;
    }

    if (selectedKind === "table") {
      const rowCount = Math.max(1, Math.min(12, Number(rows) || 3));
      const colCount = Math.max(1, Math.min(8, Number(cols) || 3));
      const header = Array.from({ length: colCount }, (_, index) => `<th>Cabeçalho ${index + 1}</th>`).join("");
      const tableRows = Array.from({ length: rowCount }, () => `<tr>${Array.from({ length: colCount }, () => "<td>Conteúdo</td>").join("")}</tr>`).join("");
      return `<div class="asset-insert-block asset-table-block" data-kind="table"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Tabela"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<table><thead><tr>${header}</tr></thead><tbody>${tableRows}</tbody></table></div><p><br></p>`;
    }

    if (selectedKind === "callout") {
      return `<div class="asset-insert-block asset-callout" data-kind="callout"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Texto destacado"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<p data-block-body>${safeBody || "Escreva aqui o ponto importante."}</p></div><p><br></p>`;
    }

    if (selectedKind === "link") {
      return `<div class="asset-insert-block asset-link-card" data-kind="link" data-url="${safeUrl || "#"}"><div><strong data-block-title>${safeLabel}</strong>${safeCaption ? `<p data-block-caption>${safeCaption}</p>` : ""}<a href="${safeUrl || "#"}" target="_blank" rel="noopener noreferrer">${safeUrl || "Link"}</a></div><button type="button" data-edit-block contenteditable="false">Editar</button></div><p><br></p>`;
    }

    if (selectedKind === "internal-link") {
      const href = url.trim().startsWith("#") || url.trim().startsWith("/") ? escapeHtml(url.trim()) : safeUrl || "#";
      return `<div class="asset-insert-block asset-internal-link" data-kind="internal-link" data-url="${href}"><div><strong data-block-title>${safeLabel || "Link interno"}</strong>${safeCaption ? `<p data-block-caption>${safeCaption}</p>` : ""}<a href="${href}">${href}</a></div><button type="button" data-edit-block contenteditable="false">Editar</button></div><p><br></p>`;
    }

    if (selectedKind === "nested-card") {
      return `<div class="asset-insert-block asset-nested-card" data-kind="nested-card"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Card interno"}</strong><button type="button" data-edit-block>Editar</button></div>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<div class="asset-nested-card-body" data-block-body>${safeBody || "Conteúdo do card interno."}</div></div><p><br></p>`;
    }

    if (selectedKind === "document") {
      return `<div class="asset-insert-block asset-document-card" data-kind="document" data-url="${safeUrl || "#"}"><a class="asset-document" href="${safeUrl || "#"}" target="_blank" rel="noopener noreferrer"><span>📄</span><strong data-block-title>${safeLabel}</strong></a><button type="button" data-edit-block contenteditable="false">Editar</button></div><p><br></p>`;
    }

    if (selectedKind === "attachment") {
      return `<div class="asset-insert-block asset-attachment" data-kind="attachment" data-url="${safeUrl || "#"}"><div><strong data-block-title>${safeLabel || "Anexo"}</strong>${safeCaption ? `<p data-block-caption>${safeCaption}</p>` : ""}${safeBody ? `<p data-block-body>${safeBody}</p>` : ""}<a href="${safeUrl || "#"}" target="_blank" rel="noopener noreferrer">Abrir anexo</a></div><button type="button" data-edit-block contenteditable="false">Editar</button></div><p><br></p>`;
    }

    if (selectedKind === "youtube") {
      const videoId = extractYouTubeVideoId(url);
      const embedUrl = videoId ? `https://www.youtube.com/embed/${escapeHtml(videoId)}` : safeUrl;
      return `<div class="asset-insert-block asset-embed asset-youtube" data-kind="youtube" data-url="${embedUrl}"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Vídeo do YouTube"}</strong><button type="button" data-edit-block>Editar</button></div><iframe class="asset-embed-frame" src="${embedUrl}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}</div><p><br></p>`;
    }

    if (selectedKind === "embed") {
      return `<div class="asset-insert-block asset-embed asset-external" data-kind="embed" data-url="${safeUrl}"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Página externa"}</strong><button type="button" data-edit-block>Editar</button></div><iframe class="asset-embed-frame" src="${safeUrl}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>${safeCaption ? `<p class="asset-block-caption" data-block-caption>${safeCaption}</p>` : ""}<p class="asset-embed-fallback">Se a página bloquear o embed, <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">abra em nova aba</a>.</p></div><p><br></p>`;
    }

    if (selectedKind === "divider") {
      return `<div class="asset-insert-block asset-page-divider" data-kind="divider"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeTitle || "Divisor de página"}</strong><button type="button" data-edit-block>Editar</button></div><hr></div><p><br></p>`;
    }

    return `<figure class="asset-insert-block asset-image-block" data-kind="image" data-url="${safeUrl}"><div class="asset-block-actions" contenteditable="false"><strong data-block-title>${safeLabel}</strong><button type="button" data-edit-block>Editar</button></div><img src="${safeUrl}" alt="${safeLabel}" /><figcaption data-block-caption>${safeCaption || safeLabel}</figcaption></figure><p><br></p>`;
  }

  function insert() {
    onInsert(buildHtml());
    onClose();
  }

  const specialFieldsForSelected = SPECIAL_MODEL_FIELDS[selectedKind] ?? [];
  const needsUrl = ["link", "internal-link", "document", "image", "youtube", "embed", "attachment", "link-model"].includes(selectedKind);
  const needsBody = ["checklist", "accordion", "nested-card", "code", "secret", "callout", "attachment"].includes(selectedKind);

  function updateSpecialField(key: SpecialFieldKey, value: string) {
    setFieldValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={`max-h-[90vh] w-full overflow-auto rounded-[2rem] border bg-card p-5 shadow-2xl ${specialFieldsForSelected.length ? "max-w-5xl" : "max-w-3xl"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{mode === "edit" ? "Editar conteúdo" : "Inserção rápida"}</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">{mode === "edit" ? "Atualizar bloco inserido" : "Adicionar conteúdo ao card"}</h3>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Fechar popup">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {INSERT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.kind}
                type="button"
                onClick={() => setSelectedKind(option.kind)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  selectedKind === option.kind ? "border-primary bg-primary text-primary-foreground" : "bg-background/70 hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4">
          <div className="space-y-2">
            <label htmlFor="insert-title" className="text-sm font-medium">
              Título ou rótulo
            </label>
            <Input id="insert-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: API de produção" />
          </div>

          <div className="space-y-2">
            <label htmlFor="insert-caption" className="text-sm font-medium">
              Legenda <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input id="insert-caption" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Ex.: observação curta sobre este item" />
          </div>

          {needsUrl && (
            <div className="space-y-2">
              <label htmlFor="insert-url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="insert-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder={
                  selectedKind === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : selectedKind === "internal-link"
                      ? "#secao ou /assets/ID_DO_CARD"
                      : "https://..."
                }
              />
            </div>
          )}

          {specialFieldsForSelected.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {specialFieldsForSelected.map((fieldKey) => {
                const field = SPECIAL_FIELD_LABELS[fieldKey];
                const id = `special-${fieldKey}`;
                const value = fieldValues[fieldKey] ?? "";
                const isStepField = fieldKey === "steps";
                return (
                  <div key={fieldKey} className={`space-y-2 ${field.full ? "sm:col-span-2" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={id} className="text-sm font-medium">
                        {field.label} <span className="text-muted-foreground">(opcional)</span>
                      </label>
                      {isStepField && (
                        <Button type="button" variant="outline" size="sm" onClick={() => updateSpecialField(fieldKey, `${value}${value ? "\n" : ""}Novo passo`)}>
                          Adicionar passo
                        </Button>
                      )}
                    </div>
                    {field.multiline ? (
                      <Textarea
                        id={id}
                        value={value}
                        onChange={(event) => updateSpecialField(fieldKey, event.target.value)}
                        className={fieldKey === "instructions" ? "min-h-[45vh]" : "min-h-28"}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input id={id} value={value} onChange={(event) => updateSpecialField(fieldKey, event.target.value)} placeholder={field.placeholder} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedKind === "attachment" && (
            <div className="rounded-2xl border border-dashed bg-background/60 p-4 text-sm text-muted-foreground">
              Área para anexos: cole uma URL de arquivo, documento, drive ou página. Upload físico de arquivos pode ser ligado depois a um storage.
            </div>
          )}

          {selectedKind === "table" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="insert-rows" className="text-sm font-medium">Linhas</label>
                <Input id="insert-rows" type="number" min={1} max={12} value={rows} onChange={(event) => setRows(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="insert-cols" className="text-sm font-medium">Colunas</label>
                <Input id="insert-cols" type="number" min={1} max={8} value={cols} onChange={(event) => setCols(event.target.value)} />
              </div>
            </div>
          ) : (
            needsBody && (
              <div className="space-y-2">
                <label htmlFor="insert-body" className="text-sm font-medium">
                  Conteúdo
                </label>
                <Textarea
                  id="insert-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="min-h-40"
                  placeholder={
                    selectedKind === "checklist"
                      ? "Um item por linha. Use: Nome do item | detalhe opcional"
                      : selectedKind === "accordion"
                        ? "Escreva o conteúdo que ficará escondido dentro da lista recolhível."
                        : "Escreva ou cole o conteúdo aqui..."
                  }
                />
              </div>
            )
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={insert}>
            {mode === "edit" ? "Salvar edição" : "Inserir no editor"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder, minHeightClassName = "min-h-[560px]" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef("");
  const savedRangeRef = useRef<Range | null>(null);
  const editingElementRef = useRef<HTMLElement | null>(null);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [modal, setModal] = useState<ModalState>({ open: false, kind: "checklist", mode: "insert" });

  const placeholderText = useMemo(() => placeholder ?? "Comece a escrever...", [placeholder]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement !== editor && lastValueRef.current !== value) {
      editor.innerHTML = value;
      lastValueRef.current = value;
    }
    setStats(getTextStats(editor.innerText ?? ""));
  }, [value]);

  function emitChange() {
    const editor = editorRef.current;
    const html = editor?.innerHTML ?? "";
    lastValueRef.current = html;
    setStats(getTextStats(editor?.innerText ?? ""));
    onChange(html);
  }

  function nodeIsInsideEditor(node: Node) {
    const editor = editorRef.current;
    if (!editor) return false;

    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return element ? editor.contains(element) : false;
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!nodeIsInsideEditor(range.commonAncestorContainer)) return;

    savedRangeRef.current = range.cloneRange();
  }

  function moveCursorToEditorEnd() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  }

  function restoreSelection() {
    const selection = window.getSelection();
    const range = savedRangeRef.current;

    if (!selection || !range || !nodeIsInsideEditor(range.commonAncestorContainer)) {
      moveCursorToEditorEnd();
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function run(command: string, commandValue?: string) {
    restoreSelection();
    focusEditor();
    document.execCommand(command, false, commandValue);
    saveSelection();
    emitChange();
  }

  function applyLineHeight(lineHeight: string) {
    if (!lineHeight) return;
    restoreSelection();
    focusEditor();

    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range) return;

    if (range.collapsed) {
      const container = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
      const block = container instanceof HTMLElement ? container.closest("p,div,li,blockquote,h1,h2,h3") : null;
      const target = block instanceof HTMLElement && editorRef.current?.contains(block) ? block : editorRef.current;
      if (target) target.style.lineHeight = lineHeight;
    } else {
      const span = document.createElement("span");
      span.style.lineHeight = lineHeight;
      span.append(range.extractContents());
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    saveSelection();
    emitChange();
  }

  function insertHtml(html: string) {
    restoreSelection();
    focusEditor();
    document.execCommand("insertHTML", false, html);
    saveSelection();
    emitChange();
  }

  function replaceEditedBlock(html: string) {
    const block = editingElementRef.current;
    if (!block) {
      insertHtml(html);
      return;
    }

    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const fragment = template.content;
    const lastNode = fragment.lastChild;
    block.replaceWith(fragment);

    if (lastNode) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStartAfter(lastNode);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }

    editingElementRef.current = null;
    emitChange();
  }

  function createLink() {
    const url = normalizeUrl(window.prompt("Cole o link") ?? "");
    if (!url) return;
    run("createLink", url);
  }

  function insertImage() {
    const url = normalizeUrl(window.prompt("Cole a URL da imagem") ?? "");
    if (!url) return;
    run("insertImage", url);
  }

  function openInsert(kind: InsertKind = "checklist") {
    saveSelection();
    editingElementRef.current = null;
    setModal({ open: true, kind, mode: "insert" });
  }

  function openEditBlock(block: HTMLElement) {
    const kind = block.dataset.kind;
    if (!isInsertKind(kind)) return;

    editingElementRef.current = block;
    setModal({
      open: true,
      kind,
      mode: "edit",
      draft: readBlockDraft(block, kind),
    });
  }

  async function copyCodeFromButton(button: HTMLButtonElement) {
    const block = button.closest(".asset-code-block");
    const code = block?.querySelector("code")?.textContent ?? "";
    if (!code.trim()) return;
    await navigator.clipboard.writeText(code);
    const oldText = button.textContent;
    button.textContent = "Copiado";
    window.setTimeout(() => {
      button.textContent = oldText || "Copiar";
    }, 1200);
  }

  return (
    <div className="rich-editor-surface">
      <div
        className="rich-editor-toolbar"
        onMouseDownCapture={(event) => {
          saveSelection();
          const target = event.target;
          if (target instanceof HTMLElement && target.closest("button")) {
            event.preventDefault();
          }
        }}
      >
        <select aria-label="Formato do parágrafo" className="rich-editor-select" onChange={(event) => run("formatBlock", event.target.value)} defaultValue="p">
          <option value="p">Parágrafo</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="blockquote">Citação</option>
        </select>

        <select aria-label="Fonte" className="rich-editor-select" onChange={(event) => run("fontName", event.target.value)} defaultValue={FONT_FAMILIES[0].value}>
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>

        <select aria-label="Tamanho do texto" className="rich-editor-select" onChange={(event) => run("fontSize", event.target.value)} defaultValue="3">
          {SIZE_LABELS.map((size) => (
            <option key={size.value} value={size.value}>{size.label}</option>
          ))}
        </select>

        <select aria-label="Distância entre linhas" className="rich-editor-select" onChange={(event) => applyLineHeight(event.target.value)} defaultValue="">
          {LINE_HEIGHTS.map((lineHeight) => (
            <option key={lineHeight.value || "default"} value={lineHeight.value}>{lineHeight.label}</option>
          ))}
        </select>

        <button type="button" className={toolbarButtonClass()} onClick={() => run("bold")} aria-label="Negrito"><Bold className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("italic")} aria-label="Itálico"><Italic className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("underline")} aria-label="Sublinhado"><Underline className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("strikeThrough")} aria-label="Riscado"><Minus className="h-4 w-4" /></button>

        <label className="rich-color-button" title="Cor do texto">
          <Type className="h-4 w-4" />
          <input type="color" onChange={(event) => run("foreColor", event.target.value)} />
        </label>

        <label className="rich-color-button" title="Cor de fundo">
          <PaintBucket className="h-4 w-4" />
          <input type="color" onChange={(event) => run("hiliteColor", event.target.value)} />
        </label>

        <button type="button" className={toolbarButtonClass()} onClick={() => run("justifyLeft")} aria-label="Alinhar à esquerda"><AlignLeft className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("justifyCenter")} aria-label="Centralizar"><AlignCenter className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("justifyRight")} aria-label="Alinhar à direita"><AlignRight className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("justifyFull")} aria-label="Justificar"><AlignJustify className="h-4 w-4" /></button>

        <button type="button" className={toolbarButtonClass()} onClick={() => run("insertUnorderedList")} aria-label="Lista"><List className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("insertOrderedList")} aria-label="Lista numerada"><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("formatBlock", "blockquote")} aria-label="Citação"><Quote className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("formatBlock", "p")} aria-label="Parágrafo"><Pilcrow className="h-4 w-4" /></button>

        <button type="button" className={toolbarButtonClass()} onClick={createLink} aria-label="Inserir link"><LinkIcon className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={insertImage} aria-label="Inserir imagem"><ImageIcon className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("removeFormat")} aria-label="Limpar formatação"><Eraser className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("undo")} aria-label="Desfazer"><Undo2 className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass()} onClick={() => run("redo")} aria-label="Refazer"><Redo2 className="h-4 w-4" /></button>

      </div>

      <div className="rich-editor-palette" onMouseDown={(event) => event.preventDefault()}>
        <span>Texto</span>
        {COLOR_PALETTE.map((color) => (
          <button key={`text-${color}`} type="button" className="rich-swatch" style={{ background: color }} onClick={() => run("foreColor", color)} aria-label={`Aplicar cor ${color}`} />
        ))}
        <span>Fundo</span>
        {HIGHLIGHT_PALETTE.map((color) => (
          <button key={`highlight-${color}`} type="button" className="rich-swatch" style={{ background: color }} onClick={() => run("hiliteColor", color)} aria-label={`Aplicar destaque ${color}`} />
        ))}
      </div>

      <div
        ref={editorRef}
        className={`rich-editor-content ${minHeightClassName}`}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholderText}
        onInput={() => {
          emitChange();
          saveSelection();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onFocus={saveSelection}
        onBlur={() => {
          saveSelection();
          emitChange();
        }}
        onClick={(event) => {
          const target = event.target;
          if (target instanceof HTMLButtonElement && target.matches("[data-copy-code]")) {
            void copyCodeFromButton(target);
            return;
          }

          if (target instanceof HTMLButtonElement && target.matches("[data-edit-block]")) {
            const block = target.closest<HTMLElement>("[data-kind]");
            if (block) openEditBlock(block);
            return;
          }

          saveSelection();
        }}
      />

      <div className="rich-editor-quickbar" onMouseDown={(event) => event.preventDefault()}>
        <p className="rich-editor-quickbar-title">Componentes</p>
        {INSERT_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button key={option.kind} type="button" onClick={() => openInsert(option.kind)}>
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="rich-editor-footer" contentEditable={false}>
        <span><Rows3 className="h-4 w-4" /> {stats.words} palavras</span>
        <span>{stats.chars} caracteres</span>
      </div>

      <InsertContentModal
        open={modal.open}
        kind={modal.kind}
        mode={modal.mode}
        draft={modal.draft}
        onClose={() => {
          editingElementRef.current = null;
          setModal((current) => ({ ...current, open: false }));
        }}
        onInsert={(html) => {
          if (modal.mode === "edit") {
            replaceEditedBlock(html);
            return;
          }
          insertHtml(html);
        }}
      />
    </div>
  );
}
