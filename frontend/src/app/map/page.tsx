"use client";

import dynamic from "next/dynamic";
import { TopBar } from "@/components/layout/TopBar";

const CityMap = dynamic(() => import("@/components/maps/CityMap").then((module) => module.CityMap), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center font-data-mono text-sm text-on-surface-variant">LOADING MAP DATA...</div>,
});

export default function MapPage() {
  return (
    <div className="relative h-screen w-full flex flex-col bg-surface-container-lowest">
      <TopBar />
      <main className="relative flex-1 w-full overflow-hidden">
        <CityMap />
      </main>
    </div>
  );
}
