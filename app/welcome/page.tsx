import Link from "next/link";

/** Optional marketing / explainer route. The main paste-and-analyze tool lives at `/`. */
export default function WelcomePage() {
  return (
    <main className="relative mx-auto flex min-h-[85vh] w-full max-w-2xl flex-col items-center justify-center gap-12 px-4 py-16 text-center text-white md:gap-16">
      <div className="space-y-4">
        <h1 className="font-serif text-[clamp(1.65rem,5.5vw,3rem)] uppercase tracking-[0.38em] text-paper md:tracking-[0.48em]">
          WHYITSLAPS
        </h1>
        <p className="mx-auto max-w-lg font-mono text-[11px] uppercase leading-relaxed tracking-[0.28em] text-white/62">
          Paste a tiktok · short · spotify track · find out why it slaps.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex h-14 min-h-14 items-center justify-center border border-white/35 bg-white px-8 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-paper"
        >
          Open the tool
        </Link>
        <Link
          href="/?fresh=1"
          className="inline-flex h-14 min-h-14 items-center justify-center border border-white/35 bg-transparent px-8 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-paper transition hover:border-white/55 hover:text-white"
        >
          Start clean
        </Link>
      </div>

      <p className="max-w-md font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        TikTok · YouTube · X · upload a reel · Spotify · under ~60s
      </p>
    </main>
  );
}
