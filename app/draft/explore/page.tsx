"use client";

import Link from "next/link";
import React from "react";

import { EntryCard } from "@/components/draft/EntryCard";
import { MOCK_EXPLORE } from "@/lib/draft/mock-feed";
import { formatDraftDate } from "@/lib/draft/mock-feed";

export default function DraftExplorePage() {
  const [publishMock, setPublishMock] = React.useState(false);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/12 pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">draft · community</p>
          <h1 className="mt-2 font-serif text-2xl uppercase tracking-[0.18em] text-paper">Slap library</h1>
          <p className="mt-2 max-w-lg font-mono text-[10px] leading-relaxed text-white/50">
            Not a live feed of everything everyone analyzes — only entries someone explicitly published. Safer and
            still feels social.
          </p>
        </div>
        <div className="flex border border-white/18">
          <Link
            href="/draft/history"
            className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 hover:text-white/70"
          >
            history
          </Link>
          <span className="bg-paper px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
            explore
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-6 border border-white/10 bg-white/[0.02] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">publish toggle (mock)</p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-white/50">
            On real results screens: &quot;Add to library&quot; checkbox — default off. Analyze stays private until you
            opt in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPublishMock((v) => !v)}
          className={`min-w-[140px] border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
            publishMock
              ? "border-paper bg-paper text-black"
              : "border-white/25 text-white/60 hover:border-white/45 hover:text-paper"
          }`}
        >
          {publishMock ? "published (mock)" : "publish this analysis"}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-6 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
        <span>{MOCK_EXPLORE.length} public entries</span>
        <span>12 analyzes today (aggregate only — mock)</span>
        <span>no comments · no follows (yet)</span>
      </div>

      <ul className="mt-8 grid gap-4">
        {MOCK_EXPLORE.map((entry) => (
          <li key={entry.id}>
            <EntryCard
              entry={entry}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                      by {entry.publisher}
                    </span>
                    <span className="mx-2 text-white/20">·</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                      published {formatDraftDate(entry.publishedAt)}
                    </span>
                  </div>
                  {entry.publishNote ? (
                    <p className="font-mono text-[10px] leading-relaxed text-white/45 normal-case tracking-normal">
                      {entry.publishNote}
                    </p>
                  ) : null}
                </div>
              }
            />
          </li>
        ))}
      </ul>

      <section className="mt-14 border border-white/10 p-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">why not auto-log everyone?</h2>
        <ul className="mt-4 space-y-3 font-mono text-[10px] leading-relaxed text-white/50 normal-case tracking-normal">
          <li>Copyright — critiques tied to third-party URLs shouldn&apos;t be public by default.</li>
          <li>Privacy — uploads and pasted links pass through your server; users may not expect a public feed.</li>
          <li>Cost — analyze is expensive; publish should be a cheap metadata flip, not another vision call.</li>
          <li>Spam — public lists attract junk unless you gate with auth and rate limits.</li>
        </ul>
      </section>
    </main>
  );
}
