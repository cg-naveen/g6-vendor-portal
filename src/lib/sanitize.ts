/**
 * Minimal, dependency-free HTML sanitizer for the rich-text contract field.
 * The input comes from an authenticated admin, so this is defense-in-depth:
 * it strips executable/embedded content and event-handler attributes while
 * keeping the basic formatting tags our editor produces. Runs server-side
 * (no DOM), so it uses conservative regex passes.
 */
const BLOCKED_TAGS = /<\/?(?:script|style|iframe|object|embed|link|meta|form|input|button)\b[^>]*>/gi;
const EVENT_ATTRS = /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /\b(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi;

export function sanitizeHtml(input: string, maxLength = 20000): string {
  if (!input) return "";
  let out = input.slice(0, maxLength);
  out = out.replace(BLOCKED_TAGS, "");
  out = out.replace(EVENT_ATTRS, "");
  out = out.replace(JS_URLS, '$1="#"');
  return out.trim();
}

/** True when the HTML has no visible text or media once tags are stripped. */
export function isBlankHtml(input: string | null | undefined): boolean {
  if (!input) return true;
  const text = input
    .replace(/<(img|br|hr)\b[^>]*>/gi, " x ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length === 0;
}
