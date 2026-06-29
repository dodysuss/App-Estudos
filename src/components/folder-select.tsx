 "use client";

import { buildFolderOptions, type FolderOption } from "@/lib/folders";

export function FolderSelect({
  folders,
  defaultValue = "",
  value,
  onChange,
}: {
  folders: FolderOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const options = buildFolderOptions(folders);

  return (
    <select
      name="folderId"
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      className="h-11 w-full rounded-xl border bg-background/80 px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">Sem pasta</option>
      {options.map((folder) => (
        <option key={folder.id} value={folder.id}>{folder.label}</option>
      ))}
    </select>
  );
}
