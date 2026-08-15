"use client";

export type ViewMode = "brief" | "full";

type Props = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({ mode, onChange }: Props) {
  return (
    <div
      className="inline-flex border border-white/20"
      role="group"
      aria-label="Analysis detail level"
    >
      {(["brief", "full"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={mode === option}
          className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
            mode === option
              ? "bg-white/[0.1] text-paper"
              : "bg-transparent text-white/45 hover:text-white/75"
          }`}
        >
          {option === "brief" ? "brief" : "full breakdown"}
        </button>
      ))}
    </div>
  );
}
