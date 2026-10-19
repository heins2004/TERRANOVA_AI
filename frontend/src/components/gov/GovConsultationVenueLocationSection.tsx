"use client";

import { useState } from "react";
import { parseMapLinkOrCoords } from "@/lib/mapLinkParser";

interface GovConsultationVenueLocationSectionProps {
  venueLat: number | null;
  venueLng: number | null;
  onClearPin: () => void;
  onPickOnMap: () => void;
  onOpenPickerWithPin: (pin: [number, number]) => void;
}

export function GovConsultationVenueLocationSection({
  venueLat,
  venueLng,
  onClearPin,
  onPickOnMap,
  onOpenPickerWithPin,
}: GovConsultationVenueLocationSectionProps) {
  const [pasteInput, setPasteInput] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handleApply = (explicitVal?: string | unknown) => {
    setPasteError(null);
    const textToParse = typeof explicitVal === "string" ? explicitVal : pasteInput;
    const res = parseMapLinkOrCoords(textToParse);
    if (!res.success) {
      setPasteError(res.error);
      return;
    }
    setPasteError(null);
    onOpenPickerWithPin([res.lat, res.lng]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply(e.currentTarget.value);
    }
  };

  return (
    <div className="mt-[10px] rounded border border-white/10 bg-white/5 p-[10px] space-y-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-data-mono text-xs text-on-surface-variant uppercase">
          Venue Location on Map (optional)
        </span>
        {venueLat != null && venueLng != null && (
          <button
            type="button"
            id="consultation-clear-pin-btn"
            onClick={onClearPin}
            className="font-data-mono text-xs text-red-400 hover:underline"
          >
            Clear pin
          </button>
        )}
      </div>

      {/* Paste map link or coordinates input row */}
      <div>
        <label
          htmlFor="consultation-paste-map-input"
          className="block font-data-mono text-xs text-on-surface-variant uppercase mb-[4px]"
        >
          Paste map link or coordinates
        </label>
        <div className="flex items-center gap-[6px]">
          <input
            id="consultation-paste-map-input"
            type="text"
            value={pasteInput}
            onChange={(e) => {
              setPasteInput(e.target.value);
              if (pasteError) setPasteError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste Google Maps, OSM link, or lat, lng..."
            className="flex-1 rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="button"
            id="consultation-apply-map-btn"
            onClick={() => handleApply()}
            className="rounded border border-cyan-400/60 bg-cyan-950/60 px-[12px] py-[6px] font-data-mono text-xs text-cyan-300 hover:bg-cyan-900/80 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            Apply
          </button>
        </div>
        {pasteError && (
          <p
            id="consultation-paste-error-msg"
            className="text-xs text-red-400 mt-[4px] font-sans break-words"
            role="alert"
          >
            {pasteError}
          </p>
        )}
      </div>

      {/* Pick on map button and coordinate readout */}
      <div className="flex items-center gap-[10px] flex-wrap pt-[2px]">
        <button
          type="button"
          id="consultation-pick-map-btn"
          onClick={onPickOnMap}
          className="rounded border border-cyan-400/50 bg-cyan-950/40 px-[10px] py-[4px] font-data-mono text-xs text-cyan-300 hover:bg-cyan-900/60 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          {venueLat != null && venueLng != null ? "Move pin on map" : "Pick on map"}
        </button>
        <span id="consultation-pin-readout" className="font-data-mono text-xs text-white">
          {venueLat != null && venueLng != null
            ? `Lat: ${venueLat.toFixed(4)}, Lng: ${venueLng.toFixed(4)}`
            : "No pin selected"}
        </span>
      </div>
    </div>
  );
}
