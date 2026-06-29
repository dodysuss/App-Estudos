"use client";

import { useRef } from "react";
import { Bold, Code2, Heading2, Italic, Link2, List, ListOrdered, Loader2, Quote, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onPublish?: () => void;
  publishing?: boolean;
  publishDisabled?: boolean;
  textareaClassName?: string;
};

export function MarkdownEditor({ value, onChange, placeholder, onPublish, publishing = false, publishDisabled = false, textareaClassName }: MarkdownEditorProps) {
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 p-2">
        <div className="flex flex-wrap gap-1">
          {tools.map(({ label, icon: Icon, action }) => (
            <Button key={label} type="button" variant="ghost" size="icon" className="h-8 w-8" title={label} aria-label={label} onClick={action}>
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {onPublish && (
          <Button type="button" size="sm" className="h-8 px-3 text-xs" onClick={onPublish} disabled={publishing || publishDisabled}>
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Publicar
          </Button>
        )}
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("min-h-72 resize-y rounded-none border-0 focus-visible:ring-0", textareaClassName)}
        placeholder={placeholder}
        maxLength={100000}
      />
    </div>
  );
}
