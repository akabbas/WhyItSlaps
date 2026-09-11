import type { ReactNode } from "react";

import type { DraftHistoryEntry } from "@/lib/draft/mock-feed";
import { formatDraftDate } from "@/lib/draft/mock-feed";

type Props = {
  entry: DraftHistoryEntry;
  footer?: ReactNode;
  onSelect?: () => void;
};

export function EntryCard({ entry, footer, onSelect }: Props) {
  const interactive = typeof onSelect === "function";

  return (
    <article
      className={`border border-white/12 bg-white/[0.02] p-4 transition-colors md:p-5 ${
        interactive ? "cursor-pointer hover:border-white/28 hover:bg-white/[0.04]" : ""
      }`}
      onClick={interactive ? onSelect : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-white/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
            {entry.platform}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            {entry.mode}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
          {formatDraftDate(entry.analyzedAt)}
        </span>
      </div>

      <h2 className="mt-3 font-serif text-lg tracking-[0.12em] text-paper">{entry.title}</h2>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/62">{entry.vibe}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {entry.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {entry.palette.map((hex) => (
            <span
              key={hex}
              className="h-5 w-5 border border-white/15"
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
        <div className="text-right">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">vibe score</span>
          <p className="font-serif text-2xl tracking-wider text-paper">{entry.overallScore}</p>
        </div>
      </div>

      <p className="mt-3 truncate font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
        {entry.sourceLabel}
      </p>

      {footer ? <div className="mt-4 border-t border-white/8 pt-4">{footer}</div> : null}
    </article>
  );
}
