"use client";

import React from "react";
import type { AnalyzeSuccess } from "@/types/analysis";
import type { EditPlan, EditPlanResponse } from "@/types/editplan";

type ClipRow = {
  id: string;
  label: string;
  duration: string;
  description: string;
};

type Props = {
  analysis: AnalyzeSuccess;
};

function newRow(patch?: Partial<Omit<ClipRow, "id">>): ClipRow {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `clip-${Date.now()}-${Math.random()}`,
    label: patch?.label ?? "",
    duration: patch?.duration ?? "",
    description: patch?.description ?? "",
  };
}

function formatPlanForClipboard(plan: EditPlan): string {
  const lines: string[] = [];
  lines.push("YOUR EDIT PLAN — VibeCheck");
  lines.push("");
  lines.push(plan.edit_overview);
  lines.push("");
  lines.push("SEQUENCE");
  for (const s of plan.sequence) {
    lines.push(`— ${s.position}. ${s.clip_label}`);
    lines.push(`  In: ${s.in_point} | Hold: ${s.hold_duration}`);
    lines.push(`  Transition in/out: ${s.transition_in} / ${s.transition_out}`);
    lines.push(`  Grade: ${s.color_grade_instructions}`);
    lines.push(`  Texture: ${s.texture_overlay}`);
    if (s.notes.trim()) lines.push(`  Notes: ${s.notes}`);
    lines.push("");
  }
  lines.push("GLOBAL GRADE");
  lines.push(plan.global_grade_settings);
  lines.push("");
  lines.push("MUSIC");
  const m = plan.music_direction;
  lines.push(`BPM: ${m.tempo_bpm}`);
  lines.push(`Mood: ${m.genre_mood}`);
  lines.push(`Search: ${m.search_terms}`);
  lines.push(`Sync: ${m.sync_notes}`);
  lines.push("");
  lines.push("PREMIERE");
  lines.push(plan.software_steps.premiere);
  lines.push("");
  lines.push("DAVINCI RESOLVE");
  lines.push(plan.software_steps.davinci);
  lines.push("");
  lines.push("PRO TIPS");
  plan.pro_tips.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  return lines.join("\n");
}

function splitSearchTerms(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Draft clip rows so you can test GENERATE EDIT PLAN without typing boilerplate — replace with real labels when you ship. */
function draftFromAnalysis(a: AnalyzeSuccess): { rows: ClipRow[]; targetDuration: string; notes: string } {
  const c = a.claude;
  const refSec = Number.isFinite(a.video_duration_seconds) && a.video_duration_seconds > 0 ? a.video_duration_seconds : 45;
  const capped = Math.max(15, Math.min(180, refSec));

  const tagClean = (t: string) => (t.startsWith("#") ? t.slice(1) : t).trim();

  const t1 = tagClean(c.aesthetic_tags?.[0] ?? "establishing");
  const t2 = tagClean(c.aesthetic_tags?.[1] ?? "b-roll texture");

  const d1 = Math.max(5, Math.round(capped * 0.42));
  const d2 = Math.max(5, Math.round(capped * 0.38));
  const target = String(Math.round(capped));

  const desc1 = `${c.edit_style.pacing_badge} — framing / motion cues: ${c.cinematography.framing_composition.slice(0, 220)}${
    c.cinematography.framing_composition.length > 220 ? "…" : ""
  }`.trim();

  const desc2 = `Palette / grade direction: ${c.color_grade.palette_mood.slice(0, 240)}${c.color_grade.palette_mood.length > 240 ? "…" : ""} Transitions/refinement: ${c.edit_style.transitions.slice(0, 160)}${c.edit_style.transitions.length > 160 ? "…" : ""}`.trim();

  const overviewNote = `"${c.edit_style.pacing_badge}" match. ${c.vibe_summary.slice(0, 280)}${c.vibe_summary.length > 280 ? "…" : ""}`.trim();

  return {
    rows: [
      newRow({
        label: `Clip — ${t1}`,
        duration: String(d1),
        description: desc1,
      }),
      newRow({
        label: `Clip — ${t2}`,
        duration: String(d2),
        description: desc2,
      }),
    ],
    targetDuration: target,
    notes: overviewNote,
  };
}

export function EditMyFootagePanel({ analysis }: Props) {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<ClipRow[]>(() => [newRow()]);
  const [targetDuration, setTargetDuration] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<EditPlan | null>(null);
  const [copyLabel, setCopyLabel] = React.useState<string | null>(null);
  const [softwareTab, setSoftwareTab] = React.useState<"premiere" | "davinci">("premiere");

  const addRow = () => {
    if (rows.length >= 20) return;
    setRows((r) => [...r, newRow()]);
  };

  const removeRow = (id: string) => {
    setRows((r) => (r.length <= 1 ? r : r.filter((row) => row.id !== id)));
  };

  const updateRow = (id: string, patch: Partial<Omit<ClipRow, "id">>) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleAutofillDraft = () => {
    setError(null);
    setPlan(null);
    const d = draftFromAnalysis(analysis);
    setRows(d.rows);
    setTargetDuration(d.targetDuration);
    setNotes(d.notes);
  };

  const handleGenerate = async () => {
    setError(null);
    setPlan(null);
    const td = Number(targetDuration);
    if (!Number.isFinite(td) || td <= 0) {
      setError("Target duration must be a positive number.");
      return;
    }

    const clips = rows.map((row) => ({
      label: row.label.trim(),
      duration: Number(row.duration),
      description: row.description.trim(),
    }));

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      if (!c.label) {
        setError(`Clip ${i + 1}: label is required.`);
        return;
      }
      if (!c.description) {
        setError(`Clip ${i + 1}: description is required.`);
        return;
      }
      if (!Number.isFinite(c.duration) || c.duration <= 0) {
        setError(`Clip ${i + 1}: duration must be a positive number.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/editplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips,
          targetDuration: td,
          notes: notes.trim() || undefined,
          analysis,
        }),
      });
      const data = (await res.json()) as EditPlanResponse;
      if (!data.ok) {
        const parts = [data.error];
        if (data.hint) parts.push(data.hint);
        setError(parts.join(" — "));
        return;
      }
      setPlan(data.plan);
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlan = () => {
    if (!plan) return;
    const text = formatPlanForClipboard(plan);
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyLabel("clipboard blocked");
      window.setTimeout(() => setCopyLabel(null), 2600);
      return;
    }
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyLabel("copied.");
        window.setTimeout(() => setCopyLabel(null), 2200);
      },
      () => {
        setCopyLabel("clipboard failed");
        window.setTimeout(() => setCopyLabel(null), 2600);
      },
    );
  };

  return (
    <section className="mt-14 space-y-6 border border-white/10 bg-black/20 p-6">
      <button
        type="button"
        className="border border-white/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.28em] text-white hover:border-paper hover:text-paper"
        onClick={() => setOpen((o) => !o)}
      >
        EDIT MY FOOTAGE LIKE THIS →
      </button>

      {open ? (
        <div className="space-y-6 border border-white/08 bg-black/25 p-5">
          <div className="space-y-3 border border-white/10 bg-black/30 p-4 font-mono text-[12px] leading-relaxed text-white/74">
            <p className="text-[10px] uppercase tracking-[0.26em] text-paper">What this does</p>
            <p>
              VibeCheck does not upload your rushes or render a finished video yet. You describe clips you{" "}
              <span className="text-white">already shot</span> (or rough ideas for what you&apos;ll grab). The edit plan mirrors the{" "}
              <span className="text-white">reference pacing, grade direction, rhythm, and structure</span> from the breakdown above —
              actionable steps inside Premiere Pro or DaVinci Resolve. Use it alongside the{" "}
              <span className="italic text-white/88">HOW TO EDIT LIKE THIS</span> lane for coverage and execution ideas without retyping cues.
            </p>
          </div>

          <button
            type="button"
            className="border border-white/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white hover:border-paper hover:text-paper"
            onClick={handleAutofillDraft}
          >
            auto-fill from breakdown (demo)
          </button>
          <p className="font-mono text-[10px] tracking-wide text-white/45">
            Seeds two clip rows + target length + notes from this analysis so you can hit generate without manual typing. Swap labels for
            your real shots before you ship anything.
          </p>

          <div className="space-y-4">
            {rows.map((row, idx) => (
              <div key={row.id} className="grid gap-3 border border-white/12 bg-black/35 p-4 md:grid-cols-[1fr_120px_1fr_auto] md:items-start">
                <label className="block space-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                  label ({idx + 1})
                  <input
                    className="mt-1 w-full border border-white/22 bg-black/50 px-3 py-2 font-mono text-[12px] tracking-wide text-white placeholder:text-white/35"
                    value={row.label}
                    onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    placeholder="e.g. golden hour b-roll"
                  />
                </label>
                <label className="block space-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                  duration (s)
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="mt-1 w-full border border-white/22 bg-black/50 px-3 py-2 font-mono text-[12px] tracking-wide text-white placeholder:text-white/35"
                    value={row.duration}
                    onChange={(e) => updateRow(row.id, { duration: e.target.value })}
                    placeholder="12"
                  />
                </label>
                <label className="block space-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 md:col-span-1">
                  description
                  <textarea
                    rows={2}
                    className="mt-1 w-full resize-y border border-white/22 bg-black/50 px-3 py-2 font-mono text-[12px] leading-relaxed tracking-wide text-white placeholder:text-white/35"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    placeholder="What's in this clip?"
                  />
                </label>
                <div className="flex items-end justify-end md:pb-1">
                  <button
                    type="button"
                    disabled={rows.length <= 1}
                    className="border border-white/30 px-3 py-2 font-mono text-[11px] text-white/80 hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
                    onClick={() => removeRow(row.id)}
                    aria-label="Remove clip"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={rows.length >= 20}
              className="border border-white/35 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white hover:border-paper hover:text-paper disabled:opacity-35"
              onClick={addRow}
            >
              + Add Clip
            </button>
          </div>

          <label className="block max-w-xs space-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
            target duration (seconds)
            <input
              type="number"
              min={0}
              step="any"
              className="mt-1 w-full border border-white/22 bg-black/50 px-3 py-2 font-mono text-[12px] tracking-wide text-white"
              value={targetDuration}
              onChange={(e) => setTargetDuration(e.target.value)}
            />
          </label>

          <label className="block space-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
            optional notes
            <textarea
              rows={3}
              className="mt-1 w-full resize-y border border-white/22 bg-black/50 px-3 py-2 font-mono text-[12px] leading-relaxed tracking-wide text-white placeholder:text-white/35"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tone, platform, references…"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={loading}
              className="border border-white/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.28em] text-white hover:border-paper hover:text-paper disabled:opacity-45"
              onClick={() => void handleGenerate()}
            >
              GENERATE EDIT PLAN →
            </button>
            {loading ? (
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide text-white/70">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/25 border-t-paper" aria-hidden />
                generating plan…
              </span>
            ) : null}
          </div>

          {error ? <p className="font-mono text-[12px] leading-relaxed tracking-wide text-white/88">{error}</p> : null}

          {plan ? (
            <div className="mt-8 space-y-10 border-t border-white/10 pt-10">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">YOUR EDIT PLAN</h3>

              <blockquote className="max-w-3xl font-serif text-[clamp(18px,2.2vw,24px)] leading-snug tracking-wide text-white">
                {plan.edit_overview}
              </blockquote>

              <div className="space-y-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">sequence</p>
                <div className="space-y-4">
                  {plan.sequence.map((s, si) => (
                    <div
                      key={`seq-${si}-${s.position}-${s.clip_label}`}
                      className="w-full space-y-3 border-l-2 border-paper bg-black/25 pl-4 pr-3 py-4"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper">
                        {String(s.position).padStart(2, "0")} — {s.clip_label}
                      </p>
                      <div className="grid gap-2 font-mono text-[12px] leading-relaxed text-white/82 md:grid-cols-2">
                        <p>
                          <span className="text-white/50">in point</span> {s.in_point}
                        </p>
                        <p>
                          <span className="text-white/50">hold</span> {s.hold_duration}
                        </p>
                        <p>
                          <span className="text-white/50">transition in</span> {s.transition_in}
                        </p>
                        <p>
                          <span className="text-white/50">transition out</span> {s.transition_out}
                        </p>
                      </div>
                      <p className="font-mono text-[12px] leading-relaxed text-white/82">
                        <span className="text-white/50">grade</span> {s.color_grade_instructions}
                      </p>
                      <p className="font-mono text-[12px] leading-relaxed text-white/82">
                        <span className="text-white/50">texture</span> {s.texture_overlay}
                      </p>
                      {s.notes.trim() ? (
                        <p className="font-mono text-[12px] leading-relaxed text-white/82">
                          <span className="text-white/50">notes</span> {s.notes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border border-white/12 bg-black/30 p-5">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">color grade setup</h4>
                <p className="font-mono text-[12px] leading-relaxed text-white/82">{plan.global_grade_settings}</p>
              </div>

              <div className="space-y-4 border border-white/12 bg-black/30 p-5">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">music direction</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="border border-white bg-transparent px-2 py-[5px] font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                    bpm: {plan.music_direction.tempo_bpm}
                  </span>
                  <span className="border border-white bg-transparent px-2 py-[5px] font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                    {plan.music_direction.genre_mood}
                  </span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">search terms</p>
                <div className="flex flex-wrap gap-2">
                  {splitSearchTerms(plan.music_direction.search_terms).map((term) => (
                    <span
                      key={term}
                      className="border border-white/35 bg-black/45 px-2 py-[5px] font-mono text-[10px] uppercase tracking-[0.14em] text-white/90"
                    >
                      {term}
                    </span>
                  ))}
                </div>
                <p className="font-mono text-[12px] leading-relaxed text-white/82">{plan.music_direction.sync_notes}</p>
              </div>

              <div className="space-y-3 border border-white/12 bg-black/30 p-5">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">how to set it up</h4>
                <div className="flex gap-0 rounded-none border border-white/22">
                  <button
                    type="button"
                    className={`rounded-none px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] ${
                      softwareTab === "premiere"
                        ? "border-r border-white/22 bg-paper text-black"
                        : "bg-black/40 text-white/75 hover:text-paper"
                    }`}
                    onClick={() => setSoftwareTab("premiere")}
                  >
                    Premiere
                  </button>
                  <button
                    type="button"
                    title="DaVinci Resolve"
                    className={`rounded-none px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] ${
                      softwareTab === "davinci"
                        ? "bg-paper text-black"
                        : "bg-black/40 text-white/75 hover:text-paper"
                    }`}
                    onClick={() => setSoftwareTab("davinci")}
                  >
                    DaVinci Resolve
                  </button>
                </div>
                <div className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-white/82">
                  {softwareTab === "premiere" ? plan.software_steps.premiere : plan.software_steps.davinci}
                </div>
              </div>

              <div className="space-y-5 border border-white/10 bg-black/20 p-6">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">pro tips</h4>
                <ol className="space-y-4">
                  {plan.pro_tips.map((tip, index) => (
                    <li
                      key={`${tip}-${index}`}
                      className="border-l-2 border-paper pl-4 font-mono text-[12px] leading-relaxed text-white/80"
                    >
                      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.24em] text-white/54">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-col items-end gap-3">
                <button
                  type="button"
                  className="border border-white/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.28em] text-white hover:border-paper hover:text-paper"
                  onClick={handleCopyPlan}
                >
                  COPY FULL PLAN
                </button>
                <p className="min-h-[1rem] font-mono text-[11px] tracking-wide text-white/86">{copyLabel}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
