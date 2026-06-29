"use client";

import { useState, useTransition } from "react";
import { FolderPlus, Loader2 } from "lucide-react";
import { createFolder } from "@/actions/folder-actions";
import { buildFolderOptions, type FolderOption, type FolderScope } from "@/lib/folders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FolderCreateForm({ scope, folders }: { scope: FolderScope; folders: FolderOption[] }) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const options = buildFolderOptions(folders);

  function submit() {
    setMessage("");
    startTransition(async () => {
      const result = await createFolder({ scope, name, parentId });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setName("");
      setParentId("");
      setMessage("Pasta criada.");
    });
  }

  return (
    <div className="rounded-2xl border bg-card/80 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nova pasta ou subpasta" />
        <select value={parentId} onChange={(event) => setParentId(event.target.value)} className="h-11 rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Sem pasta pai</option>
          {options.map((folder) => (
            <option key={folder.id} value={folder.id}>{folder.label}</option>
          ))}
        </select>
        <Button type="button" onClick={submit} disabled={pending || !name.trim()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
          Criar pasta
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
