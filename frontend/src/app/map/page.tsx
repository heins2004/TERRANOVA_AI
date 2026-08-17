"use client";

import dynamic from "next/dynamic";

const CityMap = dynamic(() => import("@/components/maps/CityMap").then((module) => module.CityMap), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center font-data-mono text-sm text-on-surface-variant">LOADING MAP DATA...</div>,
});

export default function MapPage() {
  return <main className="relative h-screen w-full bg-surface-container-lowest"><CityMap /></main>;
}
