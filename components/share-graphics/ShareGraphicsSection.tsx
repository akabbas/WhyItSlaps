"use client";

import React from "react";
import type { AnalyzeSuccess } from "@/types/analysis";
import type { MusicAnalyzeSuccess } from "@/types/music-analysis";
import type { ShareGraphicTemplate } from "@/lib/share-image";
import { ShareGraphicsStudio } from "./ShareGraphicsStudio";
import { VideoShareCard } from "./cards/VideoShareCard";
import { VideoOverlayCard } from "./cards/VideoOverlayCard";
import { MusicShareCard } from "./cards/MusicShareCard";

type VideoProps = {
  mode: "video";
  data: AnalyzeSuccess;
  filenameBase: string;
  shareTitle: string;
  shareText?: string;
};

type MusicProps = {
  mode: "music";
  data: MusicAnalyzeSuccess;
  filenameBase: string;
  shareTitle: string;
  shareText?: string;
};

type Props = VideoProps | MusicProps;

const TEMPLATES: { id: ShareGraphicTemplate; label: string; hint: string; videoOnly?: boolean }[] = [
  { id: "story-card", label: "Story card", hint: "Full 9:16 branded graphic" },
  { id: "square-card", label: "Square card", hint: "1:1 feed post" },
  { id: "overlay", label: "Clip overlay", hint: "Transparent stats sticker", videoOnly: true },
];

export function ShareGraphicsSection(props: Props) {
  const [activeTemplate, setActiveTemplate] = React.useState<ShareGraphicTemplate | null>(null);

  const availableTemplates = TEMPLATES.filter((t) => props.mode === "video" || !t.videoOnly);

  const renderCard = (template: ShareGraphicTemplate) => {
    if (props.mode === "video") {
      if (template === "overlay") return <VideoOverlayCard data={props.data} />;
      return <VideoShareCard data={props.data} format={template === "square-card" ? "square" : "story"} />;
    }
    return <MusicShareCard data={props.data} format={template === "square-card" ? "square" : "story"} />;
  };

  return (
    <>
      <section
        aria-label="Social graphics"
        className="mt-20 border-t-2 border-dashed border-white/14 pt-12"
      >
        <div className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/38">
                Social graphics · experimental
              </p>
              <h3 className="font-serif text-2xl tracking-wide text-paper">Post this breakdown</h3>
              <p className="font-mono text-[12px] leading-relaxed tracking-wide text-white/55">
                Designed cards for Stories and feeds — separate from the text share above. Pick a format, preview, and export a PNG.
              </p>
            </div>
            <span className="border border-white/14 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
              not in main flow yet
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {availableTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setActiveTemplate(template.id)}
                className="group border border-white/14 bg-black/35 p-5 text-left transition-colors hover:border-paper/40 hover:bg-black/55"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper">{template.label}</p>
                <p className="mt-3 font-mono text-[11px] leading-relaxed tracking-wide text-white/48 group-hover:text-white/65">
                  {template.hint}
                </p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 group-hover:text-paper/70">
                  open studio →
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTemplate ? (
        <ShareGraphicsStudio
          open
          onClose={() => setActiveTemplate(null)}
          template={activeTemplate}
          filenameBase={props.filenameBase}
          shareTitle={props.shareTitle}
          shareText={props.shareText}
        >
          {renderCard(activeTemplate)}
        </ShareGraphicsStudio>
      ) : null}
    </>
  );
}
