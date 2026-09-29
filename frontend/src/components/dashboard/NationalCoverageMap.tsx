"use client";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 8 supported metropolitan cities defined in TERRANOVA AI
const SUPPORTED_CITIES = [
  { slug: "delhi", name: "Delhi", lat: 28.7041, lng: 77.1025, status: "CORE_HUB" },
  { slug: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777, status: "WESTERN_NODE" },
  { slug: "pune", name: "Pune", lat: 18.5204, lng: 73.8567, status: "METRO_SECTOR" },
  { slug: "hyderabad", name: "Hyderabad", lat: 17.385, lng: 78.4867, status: "DECCAN_HUB" },
  { slug: "bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946, status: "INNOVATION_NODE" },
  { slug: "chennai", name: "Chennai", lat: 13.0827, lng: 80.2707, status: "EAST_COAST_GRID" },
  { slug: "kochi", name: "Kochi", lat: 9.9312, lng: 76.2673, status: "COASTAL_SECTOR" },
  { slug: "thiruvananthapuram", name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, status: "SOUTHERN_TERMINAL" },
];

// HUD cyan pulsing marker icon
const hudMarkerIcon = L.divIcon({
  className: "hud-map-marker",
  html: `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:20px;height:20px;">
      <span style="position:absolute;width:16px;height:16px;border-radius:9999px;background:#22d3ee;opacity:0.35;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="position:relative;width:9px;height:9px;border-radius:9999px;background:#22d3ee;border:2px solid #ffffff;box-shadow:0 0 12px #22d3ee;"></span>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function NationalCoverageMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[230px] w-full items-center justify-center font-data-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
        INITIALIZING SPATIAL MATRIX...
      </div>
    );
  }

  return (
    <div className="relative h-[195px] w-full overflow-hidden rounded-lg border border-white/10 bg-[#0a0e17]">
      <MapContainer
        center={[22.3, 79.5]}
        zoom={4}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        touchZoom={false}
        attributionControl={false}
        className="h-full w-full z-0 pointer-events-auto"
      >
        {/* Esri World Dark Gray Base Tile Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        {/* Esri World Dark Gray Reference Layer for accurate boundaries & place names */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* 8 Supported City Nodes across India */}
        {SUPPORTED_CITIES.map((city) => (
          <Marker key={city.slug} position={[city.lat, city.lng]} icon={hudMarkerIcon}>
            <Tooltip
              direction="top"
              offset={[0, -10]}
              opacity={0.95}
              className="hud-map-tooltip"
            >
              <div className="font-data-mono text-[10px] uppercase tracking-wider text-primary bg-[#0a0e17] px-2 py-1 rounded border border-primary-container/40">
                <span className="font-semibold text-white">{city.name}</span>
                <span className="text-primary-container ml-1">[{city.status}]</span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Interactive HUD Overlay linking to /map */}
      <Link
        id="national-map-link"
        href="/map"
        className="group absolute inset-0 z-10 flex flex-col justify-between p-[12px] bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-all hover:bg-black/20"
        title="Open Full Interactive GIS Workspace"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded border border-primary-container/40 bg-surface-container-lowest/80 px-[8px] py-[3px] font-data-mono text-[9px] uppercase tracking-widest text-primary backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
            INDIA GRID // 8 NODES
          </span>
          <span className="flex items-center gap-1 rounded border border-white/20 bg-surface-container-lowest/80 px-[8px] py-[3px] font-data-mono text-[9px] uppercase tracking-wider text-on-surface-variant backdrop-blur-md transition-colors group-hover:border-primary-container group-hover:text-primary">
            EXPAND GIS
            <span className="material-symbols-outlined text-[13px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              open_in_new
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between font-data-mono text-[9px] uppercase tracking-wider text-white/60">
          <span>ESRI GEOSPATIAL TILES</span>
          <span className="text-primary group-hover:underline">CLICK TO ENTER FULL MAP →</span>
        </div>
      </Link>
    </div>
  );
}
