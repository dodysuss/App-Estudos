export type FolderScope = "COURSE" | "VIDEO_PLAYLIST" | "DIGITAL_ASSET";

export type FolderOption = {
  id: string;
  name: string;
  parentId: string | null;
};

export function buildFolderOptions(folders: FolderOption[]) {
  const byParent = new Map<string, FolderOption[]>();
  for (const folder of folders) {
    const key = folder.parentId ?? "root";
    byParent.set(key, [...(byParent.get(key) ?? []), folder]);
  }

  for (const children of byParent.values()) {
    children.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  const result: Array<FolderOption & { label: string }> = [];

  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId ?? "root") ?? [];
    for (const child of children) {
      result.push({ ...child, label: `${"— ".repeat(depth)}${child.name}` });
      walk(child.id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
}
