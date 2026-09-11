"use client";

import React from "react";
import type { ShareCardFormat } from "@/lib/share-image";
import {
  downloadBlob,
  exportElementToPng,
  shareImageFile,
  slugifyFilename,
} from "@/lib/share-image";

type Props = {
  open: boolean;
  onClose: () => void;
  filenameBase: string;
  shareTitle: string;
  shareText?: string;
  children: (format: ShareCardFormat) => React.ReactNode;
};

export function ShareCardPanel({
  open,
  onClose,
  filenameBase,
  shareTitle,
  shareText,
  children,
}: Props) {
  const [format, setFormat] = React.useState<ShareCardFormat>("story");
  const [status, setStatus] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const exportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const runExport = async (action: "download" | "share") => {
    if (!exportRef.current || busy) return;
    setBusy(true);
    setStatus(null);

    try {
      const blob = await exportElementToPng(exportRef.current, format);
      const filename = `${slugifyFilename(filenameBase) || "whyitslaps"}-${format}.png`;

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

  const previewScale = format === "story" ? 0.22 : 0.34;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/78 p-4 md:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share card preview"
        className="w-full max-w-3xl border border-white/16 bg-[#0A0A0A] p-5 md:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/12 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">Share card</p>
            <h2 className="mt-2 font-serif text-2xl text-paper">Post your breakdown</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/70 hover:text-paper"
          >
            close
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["story", "square"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFormat(option)}
              className={`border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] ${
                format === option
                  ? "border-paper bg-white/[0.06] text-paper"
                  : "border-white/14 text-white/55 hover:text-white/80"
              }`}
            >
              {option === "story" ? "story 9:16" : "square 1:1"}
            </button>
          ))}
        </div>

        <div
          ref={cardRef}
          className="mt-6 overflow-hidden rounded-sm border border-white/10 bg-black"
          style={{ height: format === "story" ? 420 : 380 }}
        >
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
              width: format === "story" ? 1080 : 1080,
              height: format === "story" ? 1920 : 1080,
            }}
          >
            {children(format)}
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
        <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-wide text-white/40">
          Story format is sized for Instagram, TikTok, and Snapchat. Drop it over your clip or use it as a standalone post.
        </p>
      </div>

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden>
        <div ref={exportRef}>{children(format)}</div>
      </div>
    </div>
  );
}
