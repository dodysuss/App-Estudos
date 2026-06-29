function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function readAttribute(attrs: string, name: string) {
  const quoted = attrs.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`, "i"));
  if (quoted?.[2]) return quoted[2];

  const unquoted = attrs.match(new RegExp(`\\s${name}=([^\\s>]+)`, "i"));
  return unquoted?.[1] ?? "";
}

function sanitizeIframe(attrs: string) {
  const rawSrc = readAttribute(attrs, "src");
  if (!rawSrc) return "";

  try {
    const url = new URL(rawSrc);
    if (!["http:", "https:"].includes(url.protocol)) return "";

    return `<iframe class="asset-embed-frame" src="${escapeAttribute(url.toString())}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`;
  } catch {
    return "";
  }
}

export function sanitizeRichHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (_match, attrs: string) => sanitizeIframe(attrs))
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\s+on\w+=(["'])[\s\S]*?\1/gi, "")
    .replace(/\s+on\w+=\S+/gi, "")
    .replace(/\s+(href|src)=(["'])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
    .trim();
}

export function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function plainTextToHtml(value: string) {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function normalizeEditorHtml(value: string | null | undefined) {
  if (!value?.trim()) return "";
  return isLikelyHtml(value) ? value : plainTextToHtml(value);
}
