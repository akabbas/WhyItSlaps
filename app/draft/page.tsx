import Link from "next/link";

export default function DraftHubPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8 md:py-14">
      <header className="space-y-3 border-b border-white/12 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">product draft</p>
        <h1 className="font-serif text-[clamp(1.4rem,4vw,2.2rem)] uppercase tracking-[0.2em] text-paper">
          History & explore
        </h1>
        <p className="font-mono text-[11px] leading-relaxed text-white/55">
          Lightweight prototypes for revisiting past analyses and an opt-in public gallery. Nothing here is wired to
          real data yet — click through to see layout and copy.
        </p>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/draft/history"
          className="group border border-white/15 p-6 transition hover:border-white/35 hover:bg-white/[0.03]"
        >
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-paper">Personal history</h2>
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-white/50">
            Your past video & music breakdowns — private list, reopen any row.
          </p>
          <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 group-hover:text-white/60">
            view mock →
          </span>
        </Link>
        <Link
          href="/draft/explore"
          className="group border border-white/15 p-6 transition hover:border-white/35 hover:bg-white/[0.03]"
        >
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-paper">Slap library</h2>
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-white/50">
            Opt-in public feed — what people chose to publish, not everything they analyzed.
          </p>
          <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 group-hover:text-white/60">
            view mock →
          </span>
        </Link>
      </section>

      <section className="mt-14 space-y-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">weighing it out</h2>

        <div className="overflow-hidden border border-white/12">
          <table className="w-full text-left font-mono text-[10px] uppercase tracking-[0.12em]">
            <thead>
              <tr className="border-b border-white/12 bg-white/[0.03] text-white/45">
                <th className="px-4 py-3">idea</th>
                <th className="px-4 py-3">pros</th>
                <th className="px-4 py-3">cons</th>
              </tr>
            </thead>
            <tbody className="text-white/55">
              <tr className="border-b border-white/8">
                <td className="px-4 py-4 align-top text-paper">local history</td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  No accounts; fast to ship; matches today&apos;s anonymous tool
                </td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  One device; storage cap; lost if user clears site data
                </td>
              </tr>
              <tr className="border-b border-white/8">
                <td className="px-4 py-4 align-top text-paper">cloud history</td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  Cross-device; backup; foundation for share links
                </td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  Auth + DB + privacy policy; ongoing storage cost
                </td>
              </tr>
              <tr className="border-b border-white/8">
                <td className="px-4 py-4 align-top text-paper">opt-in library</td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  Social discovery without auto-exposing everyone; safer legally
                </td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  Needs persistence; light moderation; not a full network yet
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 align-top text-paper">full social graph</td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  Follows, comments, real network effects
                </td>
                <td className="px-4 py-4 align-top leading-relaxed normal-case tracking-normal">
                  Abuse, ToS, moderation, notifications — different product
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="font-mono text-[10px] leading-relaxed text-white/40">
          Suggested path: local history → optional accounts → private share URLs → opt-in library. Skip logging all
          anonymous analyses into a public feed.
        </p>
      </section>

      <footer className="mt-14 flex flex-wrap gap-6 border-t border-white/12 pt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
        <Link href="/" className="hover:text-paper">open tool</Link>
        <Link href="/welcome" className="hover:text-paper">about</Link>
        <span className="text-white/30">spec: docs/draft-history-social.md</span>
      </footer>
    </main>
  );
}
