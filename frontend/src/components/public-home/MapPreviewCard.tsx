"use client";

import Link from "next/link";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BASEMAP_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LABEL_LAYER_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const BASEMAP_ATTRIBUTION = "Tiles &copy; Esri";

const INDIA_CENTER: [number, number] = [21.5, 78.9629];

export function MapPreviewCard() {
  return (
    <Link
      href="/map"
      id="landing-map-preview-card"
      aria-label="Open map"
      className="map-card group relative col-span-1 sm:col-span-2 row-span-1 sm:row-span-2 flex h-[360px] sm:h-[400px] flex-col justify-end overflow-hidden rounded-[16px] border border-white/10 bg-surface-container-lowest p-[22px] backdrop-blur-[20px] transition-all duration-300 hover:border-primary-container/60 hover:shadow-[0_0_30px_-6px_rgba(34,211,238,0.4)] hover:scale-[1.01] focus-visible:border-primary-container focus-visible:outline-none cursor-pointer"
    >
      {/* Non-interactive Leaflet Map with loaded tiles */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
        <MapContainer
          center={INDIA_CENTER}
          zoom={4}
          dragging={false}
          scrollWheelZoom={false}
          touchZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomControl={false}
          attributionControl={false}
          className="pointer-events-none h-full w-full"
        >
          <TileLayer attribution={BASEMAP_ATTRIBUTION} url={BASEMAP_URL} />
          <TileLayer url={LABEL_LAYER_URL} />
        </MapContainer>
      </div>

      {/* Surface shade vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-t from-surface-container-lowest/90 via-surface-container-lowest/40 to-transparent"
        aria-hidden="true"
      />

      {/* Top Map tag */}
      <span className="pointer-events-none absolute top-[14px] left-[14px] z-10 rounded-full border border-white/15 bg-surface-container-lowest/80 px-[10px] py-[3px] font-body-md text-[11px] text-primary-container font-medium">
        Map
      </span>

      {/* Bottom overlay text */}
      <div className="pointer-events-none relative z-10 flex flex-col gap-[4px]">
        <h3 className="font-body-md text-[20px] sm:text-[22px] font-bold text-on-surface group-hover:text-primary transition-colors">
          India map
        </h3>
        <p className="font-body-md text-[13px] text-on-surface-variant max-w-md">
          Open the interactive map to explore all projects.
        </p>
      </div>
    </Link>
  );
}
