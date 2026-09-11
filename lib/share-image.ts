import { toPng } from "html-to-image";

export type ShareCardFormat = "story" | "square";

export const SHARE_CARD_DIMENSIONS: Record<ShareCardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

export async function exportElementToPng(
  element: HTMLElement,
  format: ShareCardFormat = "story",
): Promise<Blob> {
  const { width, height } = SHARE_CARD_DIMENSIONS[format];

  const dataUrl = await toPng(element, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: true,
    skipFonts: false,
    includeQueryParams: true,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
    },
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (!blob.type) {
    return new Blob([blob], { type: "image/png" });
  }
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareImageFile(
  blob: Blob,
  filename: string,
  title: string,
  text?: string,
): Promise<"shared" | "unsupported" | "failed"> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return "unsupported";
  }

  const file = new File([blob], filename, { type: "image/png" });
  const payload: ShareData = { title, text, files: [file] };

  if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
    return "unsupported";
  }

  try {
    await navigator.share(payload);
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "failed";
    }
    return "failed";
  }
}

export function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
