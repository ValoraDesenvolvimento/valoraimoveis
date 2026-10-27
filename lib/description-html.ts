import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "blockquote",
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sanitizeDescriptionHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
  }).trim();
}

export function stripDescriptionHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function isDescriptionEmpty(html: string) {
  return stripDescriptionHtml(html).length === 0;
}

function parseMaybeJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

/** Converte texto legado (array de parágrafos ou plain text) em HTML. */
export function normalizeDescriptionHtml(value: unknown): string {
  if (typeof value === "string") {
    const parsed = parseMaybeJson(value);
    if (parsed !== value) {
      return normalizeDescriptionHtml(parsed);
    }
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
      return trimmed
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
        .join("");
    }
    return sanitizeDescriptionHtml(trimmed);
  }

  if (Array.isArray(value)) {
    const parts = value.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    );
    if (parts.length === 0) return "";
    if (parts.length === 1 && /<[a-z][\s\S]*>/i.test(parts[0])) {
      return sanitizeDescriptionHtml(parts[0]);
    }
    return parts
      .map((part) => {
        const trimmed = part.trim();
        if (/<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeDescriptionHtml(trimmed);
        return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br>")}</p>`;
      })
      .join("");
  }

  return "";
}
