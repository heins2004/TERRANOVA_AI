"use client";

import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
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

function MapController() {
  const map = useMap();

  useEffect(() => {
    map.attributionControl?.setPrefix("Leaflet");

    const coords = SUPPORTED_CITIES.map((c) => [c.lat, c.lng] as [number, number]);
    const bounds = L.latLngBounds(coords);

    const updateView = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    };

    updateView();
    const timer1 = setTimeout(updateView, 150);
    const timer2 = setTimeout(updateView, 500);

    window.addEventListener("resize", updateView);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updateView);
    };
  }, [map]);

  return null;
}

export function NationalCoverageMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[260px] w-full items-center justify-center font-data-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
        INITIALIZING SPATIAL MATRIX...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-white/10 bg-[#0a0e17] pointer-events-none">
      <style>{`
        .hud-national-map.leaflet-container,
        .hud-national-map .leaflet-container,
        .leaflet-container {
          background: #0a0e17 !important;
        }
      `}</style>
      <MapContainer
        center={[22.3, 79.5]}
        zoom={4}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        touchZoom={false}
        attributionControl={true}
        style={{ backgroundColor: "#0a0e17", width: "100%", height: "100%" }}
        className="hud-national-map h-full w-full z-0"
      >
        <MapController />
        {/* Esri World Dark Gray Base Tile Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          attribution="&copy; Esri, Leaflet"
        />
        {/* Esri World Dark Gray Reference Layer */}
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
    </div>
  );
}
