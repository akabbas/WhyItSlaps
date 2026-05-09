"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="font-mono text-[13px] leading-relaxed text-white/90">Something broke while loading the app.</p>
      {error.message ? (
        <p className="max-w-full break-words font-mono text-[11px] text-white/50">{error.message}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="border border-white/35 bg-white px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-black hover:bg-paper"
      >
        Try again
      </button>
      <p className="font-mono text-[10px] text-white/40">
        Tip: if you see this after an update, try <span className="text-white/55">?fresh=1</span> on the home URL to clear saved
        session data.
      </p>
    </main>
  );
}
