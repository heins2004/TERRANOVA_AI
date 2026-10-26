"use client";

import dynamic from "next/dynamic";

const SiteAreaMap = dynamic(
  () => import("@/components/maps/SiteAreaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-white/10 bg-black/40 font-data-mono text-xs text-on-surface-variant">
        LOADING PROPOSAL MAP...
      </div>
    ),
  }
);

interface ProposalMapSectionProps {
  hasCircle: boolean;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  siteLat: string;
  siteLng: string;
  outsideClickError: string;
  latError?: string;
  onSetPin: (lat: number, lng: number) => void;
  onOutsideClick: (distKm: number) => void;
  onOpenFullMap: () => void;
}

export function ProposalMapSection({
  hasCircle,
  centerLat,
  centerLng,
  radiusKm,
  siteLat,
  siteLng,
  outsideClickError,
  latError,
  onSetPin,
  onOutsideClick,
  onOpenFullMap,
}: ProposalMapSectionProps) {
  const hasPin = Boolean(siteLat && siteLng);
  const osmUrl = hasPin
    ? `https://www.openstreetmap.org/?mlat=${siteLat}&mlon=${siteLng}#map=17/${siteLat}/${siteLng}`
    : "#";

  return (
    <div className="space-y-[10px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block font-data-mono text-[11px] uppercase tracking-wider text-primary">
          {hasCircle
            ? "Candidate Site Area Map (Click inside circle to place pin)"
            : "Candidate Site Map (Site area circle not set by official)"}
        </label>
        <button
          type="button"
          id="planner-open-full-map-btn"
          data-testid="planner-open-full-map-btn"
          onClick={onOpenFullMap}
          className="rounded border border-primary/40 bg-primary/10 px-[12px] py-[6px] font-data-mono text-[11px] uppercase tracking-wider text-primary hover:bg-primary/20"
        >
          Open Full Map
        </button>
      </div>

      <SiteAreaMap
        mode="planner"
        hasCircle={hasCircle}
        circleCenterLat={centerLat}
        circleCenterLng={centerLng}
        circleRadiusKm={radiusKm}
        pinLat={siteLat ? parseFloat(siteLat) : null}
        pinLng={siteLng ? parseFloat(siteLng) : null}
        onSetPin={onSetPin}
        onOutsideClick={onOutsideClick}
        onOpenFullMap={onOpenFullMap}
      />

      {outsideClickError && (
        <div id="planner-outside-click-msg" className="rounded border border-danger/40 bg-danger/10 p-[10px] font-data-mono text-xs text-danger">
          {outsideClickError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/10 bg-white/[0.02] p-[12px] font-data-mono text-xs">
        <div className="flex items-center gap-[8px]">
          <span className="text-on-surface-variant">PIN LOCATION:</span>
          <span id="planner-pin-readout" className="text-primary font-semibold">
            {hasPin
              ? `${siteLat}, ${siteLng}`
              : (hasCircle ? "No pin placed (click inside circle)" : "Site area circle not set by official")}
          </span>
        </div>
        {hasPin && (
          <a
            id="planner-view-on-map-link"
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[4px] text-[11px] font-data-mono text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            VIEW ON MAP
          </a>
        )}
      </div>

      {latError && (
        <p className="font-data-mono text-[11px] text-danger">{latError}</p>
      )}
    </div>
  );
}
