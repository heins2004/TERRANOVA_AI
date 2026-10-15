"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const SiteAreaMap = dynamic(
  () => import("@/components/maps/SiteAreaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-white/10 bg-black/40 font-data-mono text-xs text-on-surface-variant">
        LOADING SITE AREA MAP...
      </div>
    ),
  }
);

const FullScreenMapModal = dynamic(
  () => import("@/components/maps/FullScreenMapModal"),
  { ssr: false }
);

interface GovSiteAreaSectionProps {
  city?: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  onChange: (centerLat: number | null, centerLng: number | null, radiusKm: number | null) => void;
  canClear: boolean;
  error?: string;
}

export function GovSiteAreaSection({
  city,
  centerLat,
  centerLng,
  radiusKm,
  onChange,
  canClear,
  error,
}: GovSiteAreaSectionProps) {
  const [radiusInput, setRadiusInput] = useState<string>(
    radiusKm != null ? String(radiusKm) : "5.0"
  );
  const [radiusError, setRadiusError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleSetCenter(lat: number, lng: number) {
    const parsedRadius = parseFloat(radiusInput);
    const validRadius =
      !isNaN(parsedRadius) && parsedRadius >= 0.5 && parsedRadius <= 50.0
        ? parsedRadius
        : 5.0;
    onChange(lat, lng, radiusKm != null ? radiusKm : validRadius);
  }

  function handleRadiusChange(val: string) {
    setRadiusInput(val);
    const parsed = parseFloat(val);
    if (!val.trim()) {
      setRadiusError("Radius is required (0.5 to 50 km).");
      onChange(centerLat, centerLng, null);
    } else if (isNaN(parsed) || parsed < 0.5 || parsed > 50.0) {
      setRadiusError("Radius must be between 0.5 and 50 km inclusive.");
      onChange(centerLat, centerLng, null);
    } else {
      setRadiusError("");
      onChange(centerLat, centerLng, parsed);
    }
  }

  function handleClear() {
    if (!canClear) return;
    onChange(null, null, null);
    setRadiusError("");
  }

  function handleModalConfirm(lat: number | null, lng: number | null, rad: number | null) {
    onChange(lat, lng, rad);
    if (rad != null) {
      setRadiusInput(String(rad));
      setRadiusError("");
    }
  }

  const hasArea = centerLat != null && centerLng != null && radiusKm != null;

  return (
    <div className="space-y-[12px] rounded-[14px] border border-white/15 bg-white/[0.02] p-[16px]">
      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <div>
          <h4 className="font-display-md text-[14px] font-semibold uppercase tracking-wider text-primary">
            Circular Site Area
          </h4>
          <p className="font-data-mono text-[11px] text-on-surface-variant">
            Click map to set circle centre. Planner will be restricted to propose within this radius.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="gov-open-full-map-btn"
            data-testid="open-full-map-btn"
            onClick={() => setIsModalOpen(true)}
            className="rounded border border-primary/40 bg-primary/10 px-[12px] py-[6px] font-data-mono text-[11px] uppercase tracking-wider text-primary hover:bg-primary/20"
          >
            Open Full Map
          </button>

          {hasArea && canClear && (
            <button
              type="button"
              id="gov-clear-site-area-btn"
              onClick={handleClear}
              className="rounded border border-danger/40 bg-danger/10 px-[12px] py-[6px] font-data-mono text-[11px] uppercase tracking-wider text-danger hover:bg-danger/20"
            >
              Clear Area
            </button>
          )}

          {hasArea && !canClear && (
            <span className="font-data-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              LOCKED (Planner invited)
            </span>
          )}
        </div>
      </div>

      <SiteAreaMap
        mode="gov"
        city={city}
        centerLat={centerLat}
        centerLng={centerLng}
        radiusKm={radiusKm ?? (parseFloat(radiusInput) || 5.0)}
        onSetCenter={handleSetCenter}
        onOpenFullMap={() => setIsModalOpen(true)}
      />

      <div className="grid gap-[14px] sm:grid-cols-2">
        <div className="rounded border border-white/10 bg-black/30 p-[10px]">
          <span className="block font-data-mono text-[10px] uppercase text-on-surface-variant">
            CENTRE COORDINATES
          </span>
          <span id="gov-site-area-center-readout" className="mt-[2px] block font-data-mono text-xs text-foreground">
            {centerLat != null && centerLng != null
              ? `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`
              : "No centre selected (click map)"}
          </span>
        </div>

        <div>
          <label className="block font-data-mono text-[10px] uppercase text-on-surface-variant">
            RADIUS IN KM (0.5 TO 50.0)
          </label>
          <input
            type="number"
            id="gov-site-area-radius-input"
            step="0.1"
            min="0.5"
            max="50"
            value={radiusInput}
            onChange={(e) => handleRadiusChange(e.target.value)}
            className="mt-[4px] w-full rounded border border-white/15 bg-white/[0.04] px-[12px] py-[8px] font-data-mono text-xs text-foreground focus:border-primary-container/80 focus:outline-none"
            placeholder="e.g. 5.0"
          />
          {radiusError && (
            <p className="mt-[4px] font-data-mono text-[11px] text-danger">{radiusError}</p>
          )}
        </div>
      </div>

      {error && (
        <p className="font-data-mono text-xs text-danger">{error}</p>
      )}

      <FullScreenMapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="gov"
        city={city}
        initialCenterLat={centerLat}
        initialCenterLng={centerLng}
        initialRadiusKm={radiusKm ?? (parseFloat(radiusInput) || 5.0)}
        onConfirm={handleModalConfirm}
        triggerButtonId="gov-open-full-map-btn"
      />
    </div>
  );
}
