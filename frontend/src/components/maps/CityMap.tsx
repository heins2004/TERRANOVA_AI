"use client";

import { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import OsmReferenceLayerManager, { ActiveOsmLayers } from "@/components/maps/OsmReferenceLayerManager";

const cityCenter: [number, number] = [20.5937, 78.9629];

type Basemap = "dark" | "satellite";

// CartoDB's free anonymous dark basemap has stopped working reliably (shows an
// "API KEY REQUIRED" watermark) — switched both modes to Esri's free tile services instead,
// which are already proven working for Satellite mode.
const BASEMAPS: Record<Basemap, { url: string; attribution: string }> = {
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

// Both Esri basemaps ship without place labels by default — this second, transparent layer
// adds names/boundaries on top, using the matching reference layer for whichever mode is active.
const LABEL_LAYERS: Record<Basemap, string> = {
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
};

export function CityMap() {
  const [activeBasemap, setActiveBasemap] = useState<Basemap>("dark");
  const [activeOsmLayers, setActiveOsmLayers] = useState<ActiveOsmLayers>({
    road: false,
    school: false,
    hospital: false,
  });
  const [isOsmLoading, setIsOsmLoading] = useState(false);
  const [isTooZoomedOut, setIsTooZoomedOut] = useState(false);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={cityCenter} className="h-full w-full" scrollWheelZoom zoom={5}>
        {/*
          IMPORTANT: no `key` prop here. react-leaflet's TileLayer already updates `url` and
          `attribution` in place (via Leaflet's internal setUrl) when these props change —
          forcing a remount via `key={activeBasemap}` destroys and recreates the whole tile
          layer on every toggle, discarding cached tiles and re-fetching everything at once.
        */}
        <TileLayer
          attribution={BASEMAPS[activeBasemap].attribution}
          url={BASEMAPS[activeBasemap].url}
        />
        <TileLayer url={LABEL_LAYERS[activeBasemap]} />
        <OsmReferenceLayerManager
          activeLayers={activeOsmLayers}
          onLoadingChange={setIsOsmLoading}
          onZoomWarningChange={setIsTooZoomedOut}
        />
      </MapContainer>

      <aside className="glass-card absolute top-[24px] right-[24px] z-[1000] w-[220px] rounded-xl p-[16px]">
        <p className="font-label-caps text-label-caps tracking-widest text-primary">BASEMAP</p>
        <div className="mt-[10px] grid grid-cols-2 gap-[4px] rounded-lg border border-white/10 bg-surface-container-lowest/80 p-[3px]">
          <button
            className={`rounded-md py-[6px] text-center font-data-mono text-[11px] uppercase transition-all ${
              activeBasemap === "dark"
                ? "border border-primary-container/50 bg-primary-container/20 font-medium text-primary shadow-sm"
                : "border border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setActiveBasemap("dark")}
            type="button"
          >
            Dark
          </button>
          <button
            className={`rounded-md py-[6px] text-center font-data-mono text-[11px] uppercase transition-all ${
              activeBasemap === "satellite"
                ? "border border-primary-container/50 bg-primary-container/20 font-medium text-primary shadow-sm"
                : "border border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setActiveBasemap("satellite")}
            type="button"
          >
            Satellite
          </button>
        </div>

        <div className="mt-[14px] pt-[12px] border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="font-label-caps text-label-caps tracking-widest text-primary">REFERENCE (OSM)</p>
            {isOsmLoading && (
              <span className="font-data-mono text-[9px] text-primary animate-pulse">FETCHING...</span>
            )}
          </div>
          <div className="mt-[8px] flex flex-col gap-[6px]">
            <button
              type="button"
              onClick={() => setActiveOsmLayers((prev) => ({ ...prev, road: !prev.road }))}
              className={`flex items-center justify-between rounded-lg border px-[10px] py-[7px] font-data-mono text-[11px] transition-all ${
                activeOsmLayers.road
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-400 font-medium shadow-sm"
                  : "border-white/10 bg-surface-container-lowest/80 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-[6px]">
                <span className="h-[8px] w-[8px] rounded-full bg-sky-400" />
                ROADS
              </span>
              <span className="text-[10px]">{activeOsmLayers.road ? "ON" : "OFF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOsmLayers((prev) => ({ ...prev, school: !prev.school }))}
              className={`flex items-center justify-between rounded-lg border px-[10px] py-[7px] font-data-mono text-[11px] transition-all ${
                activeOsmLayers.school
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-medium shadow-sm"
                  : "border-white/10 bg-surface-container-lowest/80 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-[6px]">
                <span className="h-[8px] w-[8px] rounded-full bg-emerald-400" />
                SCHOOLS
              </span>
              <span className="text-[10px]">{activeOsmLayers.school ? "ON" : "OFF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOsmLayers((prev) => ({ ...prev, hospital: !prev.hospital }))}
              className={`flex items-center justify-between rounded-lg border px-[10px] py-[7px] font-data-mono text-[11px] transition-all ${
                activeOsmLayers.hospital
                  ? "border-rose-500/60 bg-rose-500/10 text-rose-400 font-medium shadow-sm"
                  : "border-white/10 bg-surface-container-lowest/80 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-[6px]">
                <span className="h-[8px] w-[8px] rounded-full bg-rose-400" />
                HOSPITALS
              </span>
              <span className="text-[10px]">{activeOsmLayers.hospital ? "ON" : "OFF"}</span>
            </button>
          </div>
          {isTooZoomedOut && (activeOsmLayers.road || activeOsmLayers.school || activeOsmLayers.hospital) && (
            <p className="mt-[8px] font-data-mono text-[10px] text-amber-400/90 leading-tight">
              Zoom in (zoom &ge; 13) to load reference features.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}