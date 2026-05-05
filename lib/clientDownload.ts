/**
 * Parses `Content-Disposition` for a filename fallback.
 * Server always sends ASCII `filename="..."`; this covers edge variants.
 */
export function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;

  const star = /filename\*\s*=\s*([^']*)''([^;\n]+)|filename\*=UTF-8''([^;\n]+)/i.exec(header);
  if (star) {
    const raw = decodeURIComponent((star[2] ?? star[3] ?? "").trim());
    if (raw) return raw.replace(/^["']|["']$/g, "");
  }

  const plain = /filename\s*=\s*("?)([^";\n]+)\1/i.exec(header);
  if (plain?.[2]) return plain[2].trim();

  return fallback;
}
