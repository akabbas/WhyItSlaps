"use client";

import React from "react";

import {
  clearAnalysisHistory,
  formatHistoryWhen,
  listAnalysisHistory,
  removeAnalysisHistoryEntry,
  type AnalysisHistoryEntry,
} from "@/lib/analysis-history";

type Props = {
  refreshToken?: number;
  onOpen: (entry: AnalysisHistoryEntry) => void;
};

export function HistoryPanel({ refreshToken = 0, onOpen }: Props) {
  const [entries, setEntries] = React.useState<AnalysisHistoryEntry[]>([]);

  React.useEffect(() => {
    setEntries(listAnalysisHistory());
  }, [refreshToken]);

  const onDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEntries(removeAnalysisHistoryEntry(id));
  };

  const onClear = () => {
    if (!window.confirm("Clear all local analysis history on this device?")) return;
    setEntries(clearAnalysisHistory());
  };

  if (entries.length === 0) {
    return (
      <div className="border-t border-white/20 px-6 py-10 text-left md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">history log</p>
        <p className="mt-4 font-mono text-[12px] leading-relaxed text-white/65">
          No analyses saved yet. Run a video or music breakdown — it will show up here like a chat log on this
          browser only.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-white/20 text-left">
      <div className="flex items-center justify-between gap-3 border-b border-white/12 px-6 py-4 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
          {entries.length} saved · this device
        </p>
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 underline-offset-4 hover:text-paper hover:underline"
        >
          clear all
        </button>
      </div>
      <ul className="max-h-[min(28rem,60vh)] divide-y divide-white/10 overflow-y-auto">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onOpen(entry)}
              className="flex w-full items-start gap-3 px-6 py-4 text-left transition hover:bg-white/[0.04] md:px-8"
            >
              {entry.artUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.artUrl} alt="" className="mt-0.5 h-12 w-12 shrink-0 object-cover" />
              ) : (
                <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center border border-white/15 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
                  {entry.platform}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                    {entry.kind}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
                    {formatHistoryWhen(entry.analyzedAt)}
                  </span>
                  {typeof entry.score === "number" ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/80">
                      {Math.round(entry.score)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block truncate font-mono text-[12px] text-paper">{entry.title}</span>
                {entry.subtitle ? (
                  <span className="mt-1 line-clamp-2 block font-mono text-[10px] leading-relaxed text-white/50">
                    {entry.subtitle}
                  </span>
                ) : null}
                {entry.palette.length > 0 ? (
                  <span className="mt-2 flex gap-1">
                    {entry.palette.slice(0, 5).map((hex) => (
                      <span
                        key={`${entry.id}-${hex}`}
                        className="h-3 w-3 border border-white/20"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                ) : null}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => onDelete(entry.id, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDelete(entry.id, e as unknown as React.MouseEvent);
                  }
                }}
                className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30 hover:text-white/70"
              >
                del
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
