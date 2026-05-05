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

export const VIDEO_MP4_MIME = "video/mp4";

function skipLeadingAsciiWhitespace(u: Uint8Array, maxScan: number): number {
  let i = 0;
  for (; i < Math.min(u.length, maxScan); i++) {
    const c = u[i]!;
    if (c !== 0x09 && c !== 0x0a && c !== 0x0d && c !== 0x20) break;
  }
  return i;
}

/** If the payload is JSON `{ "ok": false, ... }`, return it — otherwise null. */
function tryParseErrorJsonPayload(buf: ArrayBuffer): { error: string; hint?: string } | null {
  const u = new Uint8Array(buf);
  const i = skipLeadingAsciiWhitespace(u, 64);
  if (i >= u.length || u[i] !== 0x7b) return null;
  const txt = new TextDecoder().decode(buf);
  try {
    const o = JSON.parse(txt) as { ok?: unknown; error?: unknown; hint?: unknown };
    if (o && typeof o === "object" && o.ok === false && typeof o.error === "string") {
      return { error: o.error, hint: typeof o.hint === "string" ? o.hint : undefined };
    }
    return null;
  } catch {
    return null;
  }
}

/** Typical MP4 / ISO BMFF: atom at offset 4 is `ftyp`. */
export function bufferLooksLikeMp4(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf);
  if (u.length < 12) return false;
  return u[4] === 0x66 && u[5] === 0x74 && u[6] === 0x79 && u[7] === 0x70;
}

function ensureEndsWithMp4(name: string): string {
  const t = name.trim() || "vibecheck-clip.mp4";
  return t.toLowerCase().endsWith(".mp4") ? t : `${t.replace(/\.[^./\\]+$/, "")}.mp4`;
}

/**
 * After `fetch`, when `res.ok`, turn the raw body into a Blob tagged as MP4 for OS / Finder / Photos.
 */
export function arrayBufferToMp4Download(
  buf: ArrayBuffer,
  contentDispositionHeader: string | null,
  fallbackFilename: string,
): { ok: true; blob: Blob; filename: string } | { ok: false; message: string } {
  const errJson = tryParseErrorJsonPayload(buf);
  if (errJson) {
    const glue = errJson.hint ? `${errJson.error} — ${errJson.hint}` : errJson.error;
    return { ok: false, message: glue };
  }

  if (buf.byteLength < 256) {
    return { ok: false, message: "Downloaded payload is too small to be a valid video." };
  }

  if (!bufferLooksLikeMp4(buf)) {
    return {
      ok: false,
      message:
        "The file from the server is not a playable MP4 (wrong format or incomplete). Try again or use Analyze first to verify the clip.",
    };
  }

  const fname = ensureEndsWithMp4(filenameFromContentDisposition(contentDispositionHeader, fallbackFilename));
  const blob = new Blob([buf], { type: VIDEO_MP4_MIME });

  return { ok: true, blob, filename: fname };
}

/**
 * Saves a video blob locally. Prefer File System Access API when available so the OS assigns type/folder explicitly.
 */
export async function saveVideoBlobToDevice(blob: Blob, filename: string): Promise<void> {
  const name = ensureEndsWithMp4(filename);

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    const w = window as Window &
      typeof globalThis & {
        showSaveFilePicker?: (opts: {
          suggestedName?: string;
          types?: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<FileSystemFileHandle>;
      };
    if (typeof w.showSaveFilePicker === "function") {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: name,
          types: [
            {
              description: "MP4 video",
              accept: { [VIDEO_MP4_MIME]: [".mp4"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Fall through to <a download> (e.g. Safari “not implemented” or sandbox).
      }
    }
  }

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Delay revoke: some browsers/OSes finish the hand‑off asynchronously.
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
