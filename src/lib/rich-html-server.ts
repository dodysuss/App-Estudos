import "server-only";
import DOMPurify from "isomorphic-dompurify";

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
  const cleanHtml = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "ol", "ul", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
      "a", "img", "table", "thead", "tbody", "tr", "th", "td", "iframe",
      "span", "div"
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title", "class", "style",
      "loading", "referrerpolicy", "allow", "allowfullscreen", "sandbox"
    ],
    ADD_TAGS: ["iframe"]
  });

  return cleanHtml
    .replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (_match, attrs: string) => sanitizeIframe(attrs))
    .trim();
}
