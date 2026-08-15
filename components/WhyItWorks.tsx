"use client";

type Item = { title: string; detail: string };

type Props = {
  items: Item[];
  /** Brief mode: titles only, no detail paragraphs. */
  compact?: boolean;
};

export function WhyItWorks({ items, compact = false }: Props) {
  return (
    <section className="space-y-6 border-t border-white/10 pt-8">
      <h3 className="font-mono text-[12px] uppercase tracking-[0.32em] text-paper">WHY IT WORKS</h3>
      <div className={`grid gap-4 ${compact ? "md:grid-cols-2" : "md:gap-5"}`}>
        {items.map((piece, idx) => (
          <article
            key={`${piece.title}-${idx}`}
            className="border border-white/10 bg-white/[0.02] p-5 opacity-0 animate-stagger"
            style={{ animationDelay: `${idx * 110}ms` }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/54">{String(idx + 1).padStart(2, "0")}</p>
            <h4 className="mt-2 font-serif text-xl tracking-wide text-white">{piece.title}</h4>
            {!compact ? (
              <p className="mt-3 font-mono text-[12px] leading-relaxed tracking-wide text-white/75">{piece.detail}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
