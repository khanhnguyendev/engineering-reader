const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes the five XML special characters; also safe for HTML text and attribute values. */
export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}
