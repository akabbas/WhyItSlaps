"use client";

import Link from "next/link";
import React from "react";

import { EntryCard } from "@/components/draft/EntryCard";
import { MOCK_HISTORY } from "@/lib/draft/mock-feed";

export default function DraftHistoryPage() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = MOCK_HISTORY.find((e) => e.id === selectedId);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/12 pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">draft · personal</p>
          <h1 className="mt-2 font-serif text-2xl uppercase tracking-[0.18em] text-paper">Your history</h1>
          <p className="mt-2 max-w-lg font-mono text-[10px] leading-relaxed text-white/50">
            Mock of a tab that lists every analysis you&apos;ve run on this browser. Real version would use
            localStorage (phase 1) or your account (phase 2).
          </p>
        </div>
        <div className="flex border border-white/18">
          <span className="bg-paper px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
            history
          </span>
          <Link
            href="/draft/explore"
            className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 hover:text-white/70"
          >
            explore
          </Link>
        </div>
      </header>

      {MOCK_HISTORY.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">no analyses yet</p>
          <Link href="/" className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-paper underline-offset-4 hover:underline">
            analyze something
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {MOCK_HISTORY.map((entry) => (
            <li key={entry.id}>
              <EntryCard entry={entry} onSelect={() => setSelectedId(entry.id)} />
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center"
          onClick={() => setSelectedId(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md border border-white/20 bg-[#0A0A0A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="history-detail-title"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">would reopen results</p>
            <h2 id="history-detail-title" className="mt-2 font-serif text-xl tracking-[0.12em] text-paper">
              {selected.title}
            </h2>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-white/60">
              In production, this tap would hydrate <code className="text-white/80">ResultsScreen</code> or{" "}
              <code className="text-white/80">MusicResultsScreen</code> from stored JSON — no re-analyze API call.
            </p>
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                className="border border-white/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper hover:border-white/45"
                onClick={() => setSelectedId(null)}
              >
                close
              </button>
              <button
                type="button"
                disabled
                className="border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25"
              >
                publish to library (mock)
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-12 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
        {MOCK_HISTORY.length} entries · ~{Math.round(JSON.stringify(MOCK_HISTORY).length / 1024)}kb mock payload
      </p>
    </main>
  );
}
