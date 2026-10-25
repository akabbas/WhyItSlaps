import Link from "next/link";

export function DraftBanner() {
  return (
    <div className="border-b border-amber-400/25 bg-amber-400/8 px-4 py-3 md:px-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/90">
        <span className="text-amber-300">Prototype draft</span>
        {" — "}
        mock data only, not connected to real analyses.
        <Link href="/draft" className="ml-2 underline underline-offset-4 hover:text-paper">
          back to hub
        </Link>
      </p>
    </div>
  );
}
