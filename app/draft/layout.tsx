import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DraftBanner } from "@/components/draft/DraftBanner";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DraftLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <DraftBanner />
      {children}
    </div>
  );
}
