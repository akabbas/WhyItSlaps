import Link from "next/link";

/** Optional marketing / explainer route. The main paste-and-analyze tool lives at `/`. */
export default function WelcomePage() {
  return (
    <main className="relative mx-auto flex min-h-[85vh] w-full max-w-2xl flex-col items-center justify-center gap-10 px-4 py-16 text-center text-white md:gap-12">
      <div className="space-y-4">
        <h1 className="font-serif text-[clamp(1.65rem,5.5vw,3rem)] uppercase tracking-[0.38em] text-paper md:tracking-[0.48em]">
          WHYITSLAPS
        </h1>
        <p className="mx-auto max-w-lg font-mono text-[11px] uppercase leading-relaxed tracking-[0.28em] text-white/62">
          Paste a link · get a breakdown of why it slaps.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6 border border-white/12 bg-white/[0.03] px-6 py-8 text-left">
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-paper">Video</p>
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.06em] text-white/55">
            TikTok, YouTube, Instagram, or X — vision critique, color palette, slap scores, and optional soundtrack match.
          </p>
        </div>
        <div className="h-px bg-white/10" />
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-paper">Music</p>
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.06em] text-white/55">
            Spotify track URLs — sonic breakdown from audio features and metadata.
          </p>
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex h-14 min-h-14 items-center justify-center border border-white/35 bg-white px-10 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-paper"
      >
        Try it
      </Link>

      <p className="max-w-md font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        TikTok · YouTube · X · upload a reel · Spotify · under ~60s
      </p>
    </main>
  );
}
