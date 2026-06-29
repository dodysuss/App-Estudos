export const DIGITAL_ASSET_TYPES = [
  "Nota",
  "Hack",
  "Prompt",
  "Código",
  "Link",
  "Documento",
  "Imagem",
  "Checklist",
  "Ideia",
  "Ativo digital",
  "Projeto",
  "Referência",
] as const;

export type DigitalAssetType = (typeof DIGITAL_ASSET_TYPES)[number];

export const DEFAULT_ASSET_TYPE: DigitalAssetType = "Nota";

export const ASSET_COVER_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#a855f7",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#111827",
] as const;

export function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function uniqueTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export function isDigitalAssetType(value: string): value is DigitalAssetType {
  return DIGITAL_ASSET_TYPES.includes(value as DigitalAssetType);
}
