"use client";

import type { PaletteSwatch } from "@/types/analysis";

type Props = {
  palette: PaletteSwatch[];
};

export function ColorPalette({ palette }: Props) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6 md:gap-3">
      {palette.map((chunk) => (
        <figure key={chunk.role} className="space-y-3 text-center md:text-left">
          <div
            className="mx-auto min-h-[5rem] max-w-[96px] md:mx-0 md:max-w-none"
            style={{ backgroundColor: chunk.hex, border: "1px solid rgba(0,0,0,0.35)", minHeight: "80px" }}
          />
          <figcaption className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">{chunk.role}</figcaption>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/86">
            {chunk.hex}
            <span className="ml-1 text-white/54">· {chunk.populationPercent.toFixed(1)}%</span>
          </p>
        </figure>
      ))}
    </div>
  );
}
