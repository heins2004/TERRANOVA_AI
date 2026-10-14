"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function computeDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const centerMarkerIcon = L.divIcon({
  className: "site-area-center-marker",
  html: `<div style="width:18px;height:18px;background:#22d3ee;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 10px #22d3ee;transform:translate(-50%,-50%);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const pinMarkerIcon = L.divIcon({
  className: "site-area-pin-marker",
  html: `<div style="width:24px;height:24px;background:#34d399;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 14px #34d399;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);"><div style="width:8px;height:8px;background:#ffffff;border-radius:50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    function handleLeafletClick(e: L.LeafletMouseEvent) {
      onClick(e.latlng);
    }
    map.on("click", handleLeafletClick);
    return () => {
      map.off("click", handleLeafletClick);
    };
  }, [map, onClick]);
  return null;
}

function MapBoundsController({
  center,
  radiusMeters,
}: {
  center: [number, number];
  radiusMeters?: number;
}) {
  const map = useMap();
  const [centerLat, centerLng] = center;
  useEffect(() => {
    if (!map) return;
    if (radiusMeters && radiusMeters > 0) {
      const latDelta = radiusMeters / 111320;
      const lngDelta = radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180));
      const bounds = L.latLngBounds(
        [centerLat - latDelta, centerLng - lngDelta],
        [centerLat + latDelta, centerLng + lngDelta]
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([centerLat, centerLng], map.getZoom() || 12);
    }
  }, [map, centerLat, centerLng, radiusMeters]);
  return null;
}

export interface SiteAreaMapGovProps {
  mode: "gov";
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  onSetCenter?: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

export interface SiteAreaMapPlannerProps {
  mode: "planner";
  circleCenterLat: number;
  circleCenterLng: number;
  circleRadiusKm: number;
  pinLat: number | null;
  pinLng: number | null;
  onSetPin: (lat: number, lng: number) => void;
  onOutsideClick: (distanceKm: number) => void;
}

export type SiteAreaMapProps = SiteAreaMapGovProps | SiteAreaMapPlannerProps;

const DEFAULT_INITIAL_CENTER: [number, number] = [28.6139, 77.209];

function MapInstanceHolder({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    const mapWithTap = map as unknown as { tap?: { disable: () => void } };
    if (mapWithTap.tap) {
      mapWithTap.tap.disable();
    }
    onMap(map);
  }, [map, onMap]);
  return null;
}

export default function SiteAreaMap(props: SiteAreaMapProps) {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const mapCenter: [number, number] = useMemo(() => {
    if (props.mode === "gov") {
      if (props.centerLat != null && props.centerLng != null) {
        return [props.centerLat, props.centerLng];
      }
      return DEFAULT_INITIAL_CENTER;
    } else {
      return [props.circleCenterLat, props.circleCenterLng];
    }
  }, [props]);

  const radiusMeters: number | undefined = useMemo(() => {
    if (props.mode === "gov") {
      return props.radiusKm ? props.radiusKm * 1000 : undefined;
    } else {
      return props.circleRadiusKm * 1000;
    }
  }, [props]);

  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 100) return;
    lastClickTimeRef.current = now;

    const currentProps = propsRef.current;
    if (currentProps.mode === "gov") {
      if (!currentProps.readOnly && currentProps.onSetCenter) {
        currentProps.onSetCenter(latlng.lat, latlng.lng);
      }
    } else {
      const distMeters = computeDistanceMeters(
        currentProps.circleCenterLat,
        currentProps.circleCenterLng,
        latlng.lat,
        latlng.lng
      );
      const allowedRadiusMeters = currentProps.circleRadiusKm * 1000;
      if (distMeters <= allowedRadiusMeters) {
        currentProps.onSetPin(latlng.lat, latlng.lng);
      } else {
        currentProps.onOutsideClick(distMeters / 1000);
      }
    }
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonOverlayRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const btn = buttonOverlayRef.current;
    if (!btn) return;
    btn.onclick = (e: MouseEvent) => {
      if (!mapInstanceRef.current) return;
      const rect = btn.getBoundingClientRect();
      const x =
        e.clientX >= rect.left && e.clientX <= rect.right
          ? e.clientX - rect.left
          : rect.width / 2;
      const y =
        e.clientY >= rect.top && e.clientY <= rect.bottom
          ? e.clientY - rect.top
          : rect.height / 2;
      const pt = L.point(x, y);
      const latlng = mapInstanceRef.current.containerPointToLatLng(pt);
      handleMapClick(latlng);
    };
  }, [handleMapClick]);

  return (
    <div
      id="site-area-map-container"
      ref={containerRef}
      className="relative h-[300px] w-full overflow-hidden rounded-lg border border-white/15 bg-black sm:h-[360px]"
    >
      <MapContainer
        center={mapCenter}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoom={props.mode === "planner" ? 13 : 11}
      >
        <MapInstanceHolder onMap={(m) => { mapInstanceRef.current = m; }} />
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />

        <MapClickHandler onClick={handleMapClick} />
        <MapBoundsController center={mapCenter} radiusMeters={radiusMeters} />

        {props.mode === "gov" && (
          <>
            {props.centerLat != null && props.centerLng != null && (
              <Marker
                icon={centerMarkerIcon}
                position={[props.centerLat, props.centerLng]}
              />
            )}
            {props.centerLat != null && props.centerLng != null && props.radiusKm != null && props.radiusKm > 0 && (
              <Circle
                center={[props.centerLat, props.centerLng]}
                pathOptions={{
                  color: "#22d3ee",
                  fillColor: "#22d3ee",
                  fillOpacity: 0.18,
                  weight: 2,
                }}
                radius={props.radiusKm * 1000}
              />
            )}
          </>
        )}

        {props.mode === "planner" && (
          <>
            <Circle
              center={[props.circleCenterLat, props.circleCenterLng]}
              pathOptions={{
                color: "#22d3ee",
                fillColor: "#22d3ee",
                fillOpacity: 0.18,
                weight: 2,
              }}
              radius={props.circleRadiusKm * 1000}
            />
            <Marker
              icon={centerMarkerIcon}
              position={[props.circleCenterLat, props.circleCenterLng]}
            />
            {props.pinLat != null && props.pinLng != null && (
              <Marker
                icon={pinMarkerIcon}
                position={[props.pinLat, props.pinLng]}
              />
            )}
          </>
        )}
      </MapContainer>
      <button
        ref={buttonOverlayRef}
        type="button"
        id="site-area-click-overlay"
        aria-label="Map click target"
        className="absolute inset-0 z-[500] h-full w-full cursor-crosshair border-0 bg-transparent p-0 m-0"
      />
    </div>
  );
}
