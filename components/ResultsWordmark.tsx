"use client";

type Props = {
  onHome: () => void;
};

/** Masthead home control on results. Same action as mode “new …” reset: back to the `/` input card. */
export function ResultsWordmark({ onHome }: Props) {
  return (
    <button
      type="button"
      onClick={onHome}
      aria-label="Back to WhyItSlaps home"
      className="border-0 bg-transparent p-0 text-left font-serif text-lg tracking-[0.38em] text-paper hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-paper/90 md:tracking-[0.45em]"
    >
      WHYITSLAPS
    </button>
  );
}
