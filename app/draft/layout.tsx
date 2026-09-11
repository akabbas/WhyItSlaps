import type { ReactNode } from "react";

import { DraftBanner } from "@/components/draft/DraftBanner";

export default function DraftLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <DraftBanner />
      {children}
    </div>
  );
}
