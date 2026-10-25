"use client";

import React from "react";
import type { ShareGraphicTemplate } from "@/lib/share-image";
import {
  downloadBlob,
  exportElementToPng,
  SHARE_CARD_DIMENSIONS,
  shareImageFile,
  slugifyFilename,
} from "@/lib/share-image";

type Props = {
  open: boolean;
  onClose: () => void;
  template: ShareGraphicTemplate;
  filenameBase: string;
  shareTitle: string;
  shareText?: string;
  children: React.ReactNode;
};

const TEMPLATE_LABELS: Record<ShareGraphicTemplate, string> = {
  "story-card": "Story card · 9:16",
  "square-card": "Square card · 1:1",
  overlay: "Transparent overlay",
};

export function ShareGraphicsStudio({
  open,
  onClose,
  template,
  filenameBase,
  shareTitle,
  shareText,
  children,
}: Props) {
  const [status, setStatus] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const exportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const dimensions =
    template === "square-card"
      ? SHARE_CARD_DIMENSIONS.square
      : SHARE_CARD_DIMENSIONS.story;

  const previewScale = template === "square-card" ? 0.34 : 0.22;
  const previewHeight = template === "square-card" ? 380 : 420;

  const runExport = async (action: "download" | "share") => {
    if (!exportRef.current || busy) return;
    setBusy(true);
    setStatus(null);

    try {
      const blob = await exportElementToPng(exportRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        transparent: template === "overlay",
      });
      const suffix = template === "overlay" ? "overlay" : template === "square-card" ? "square" : "story";
      const filename = `${slugifyFilename(filenameBase) || "whyitslaps"}-${suffix}.png`;

      if (action === "download") {
        downloadBlob(blob, filename);
        setStatus("image saved.");
      } else {
        const result = await shareImageFile(blob, filename, shareTitle, shareText);
        if (result === "shared") {
          setStatus("shared.");
        } else if (result === "unsupported") {
          downloadBlob(blob, filename);
          setStatus("share unavailable — downloaded instead.");
        } else {
          setStatus("share cancelled.");
        }
      }
    } catch {
      setStatus("export failed — try again.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setStatus(null), 2800);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/82 p-4 md:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share graphics studio"
        className="w-full max-w-3xl border border-white/16 bg-[#0A0A0A] p-5 md:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/12 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Social graphics studio</p>
            <h2 className="mt-2 font-serif text-2xl text-paper">{TEMPLATE_LABELS[template]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/70 hover:text-paper"
          >
            close
          </button>
        </div>

        {template === "overlay" ? (
          <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-wide text-white/50">
            Transparent PNG — layer over your clip in Instagram or TikTok. Your video shows through behind the stats panel.
          </p>
        ) : (
          <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-wide text-white/50">
            Full branded card for Stories or feed posts.
          </p>
        )}

        <div
          className="mt-6 overflow-hidden rounded-sm border border-white/10"
          style={{
            height: previewHeight,
            background:
              template === "overlay"
                ? "repeating-conic-gradient(#1a1a1a 0% 25%, #111 0% 50%) 50% / 24px 24px"
                : "#000",
          }}
        >
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
              width: dimensions.width,
              height: dimensions.height,
            }}
          >
            {children}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runExport("download")}
            className="border border-white/35 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white hover:border-paper hover:text-paper disabled:opacity-40"
          >
            download png
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runExport("share")}
            className="border border-paper bg-white/[0.04] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-paper hover:bg-white/[0.08] disabled:opacity-40"
          >
            share image
          </button>
        </div>

        <p className="mt-3 min-h-[1rem] font-mono text-[11px] tracking-wide text-white/70">{status}</p>
      </div>

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden>
        <div ref={exportRef}>{children}</div>
      </div>
    </div>
  );
}
