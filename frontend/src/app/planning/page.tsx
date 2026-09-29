"use client";

import dynamic from "next/dynamic";

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
    <main className="relative h-screen w-full bg-surface-container-lowest">
      <PlanningMap />
    </main>
  );
}
