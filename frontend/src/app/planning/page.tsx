"use client";

import dynamic from "next/dynamic";
import { TopBar } from "@/components/layout/TopBar";

const PlanningMap = dynamic(
  () => import("@/components/planning/PlanningMap").then((module) => module.PlanningMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center font-data-mono text-sm text-on-surface-variant">
        LOADING PLANNING WORKSPACE...
      </div>
    ),
  }
);

export default function PlanningPage() {
  return (
    <div className="relative h-screen w-full flex flex-col bg-surface-container-lowest">
      <TopBar />
      <main className="relative flex-1 w-full overflow-hidden">
        <PlanningMap />
      </main>
    </div>
  );
}
