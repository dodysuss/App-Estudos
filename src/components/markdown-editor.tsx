"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Code2, Eye, Heading2, Italic, Link2, List, ListOrdered, Pencil, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insert(before: string, after = "", fallback = "texto") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  const tools = [
    { label: "Negrito", icon: Bold, action: () => insert("**", "**") },
    { label: "Itálico", icon: Italic, action: () => insert("_", "_") },
    { label: "Título", icon: Heading2, action: () => insert("## ", "", "Título") },
    { label: "Lista", icon: List, action: () => insert("- ", "", "Item") },
    { label: "Lista numerada", icon: ListOrdered, action: () => insert("1. ", "", "Item") },
    { label: "Citação", icon: Quote, action: () => insert("> ", "", "Citação") },
    { label: "Código", icon: Code2, action: () => insert("`", "`", "código") },
    { label: "Link", icon: Link2, action: () => insert("[", "](https://)", "título") },
  ];

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 p-2">
        <div className="flex flex-wrap gap-1">
          {tools.map(({ label, icon: Icon, action }) => (
            <Button key={label} type="button" variant="ghost" size="icon" className="h-8 w-8" title={label} aria-label={label} onClick={action} disabled={mode === "preview"}>
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex rounded-md bg-secondary p-0.5">
          <Button type="button" size="sm" variant={mode === "write" ? "default" : "ghost"} className="h-7 px-2.5 text-xs" onClick={() => setMode("write")}><Pencil className="h-3.5 w-3.5" />Editar</Button>
          <Button type="button" size="sm" variant={mode === "preview" ? "default" : "ghost"} className="h-7 px-2.5 text-xs" onClick={() => setMode("preview")}><Eye className="h-3.5 w-3.5" />Visualizar</Button>
        </div>
      </div>
      {mode === "write" ? (
        <Textarea ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-72 resize-y rounded-none border-0 focus-visible:ring-0" placeholder={placeholder} maxLength={100000} />
      ) : (
        <div className="markdown-preview min-h-72 p-4 text-sm">
          {value.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>{value}</ReactMarkdown> : <p className="text-muted-foreground">Nada para visualizar ainda.</p>}
        </div>
      )}
    </div>
  );
}
