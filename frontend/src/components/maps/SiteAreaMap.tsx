"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getCityCoordinates } from "@/lib/cities";
import {
  computeDistanceMeters,
  centerMarkerIcon,
  pinMarkerIcon,
  ESRI_DARK_TILES,
} from "./mapUtils";
import { MapBoundsController } from "./MapBoundsController";

export { computeDistanceMeters };

function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    function handleLeafletClick(e: L.LeafletMouseEvent) {
      onClick(e.latlng);
    }
    function handleDomClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest(".leaflet-control") || target.closest("button") || target.closest("a")) return;
      const pt = map.mouseEventToContainerPoint(e);
      const latlng = map.containerPointToLatLng(pt);
      onClick(latlng);
    }
    map.on("click", handleLeafletClick);
    const container = map.getContainer();
    container.addEventListener("click", handleDomClick);
    return () => {
      map.off("click", handleLeafletClick);
      container.removeEventListener("click", handleDomClick);
    };
  }, [map, onClick]);
  return null;
}

export interface SiteAreaMapGovProps {
  mode: "gov";
  city?: string | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  onSetCenter?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  onOpenFullMap?: () => void;
}

export interface SiteAreaMapPlannerProps {
  mode: "planner";
  city?: string | null;
  circleCenterLat: number;
  circleCenterLng: number;
  circleRadiusKm: number;
  pinLat: number | null;
  pinLng: number | null;
  onSetPin: (lat: number, lng: number) => void;
  onOutsideClick: (distanceKm: number) => void;
  onOpenFullMap?: () => void;
}

export type SiteAreaMapProps = SiteAreaMapGovProps | SiteAreaMapPlannerProps;

function MapInstanceHolder({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const container = map.getContainer();
    if (container) {
      (container as unknown as { _leaflet_map: L.Map })._leaflet_map = map;
    }
    onMap(map);
  }, [map, onMap]);
  return null;
}

export default function SiteAreaMap(props: SiteAreaMapProps) {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const initialCenter: [number, number] = useMemo(() => {
    if (props.mode === "gov") {
      if (props.centerLat != null && props.centerLng != null) {
        return [props.centerLat, props.centerLng];
      }
      const coords = getCityCoordinates(props.city);
      return [coords.lat, coords.lng];
    }
    return [props.circleCenterLat, props.circleCenterLng];
  }, [props]);

  const radiusMeters: number | undefined = useMemo(() => {
    if (props.mode === "gov") {
      return props.radiusKm ? props.radiusKm * 1000 : undefined;
    }
    return props.circleRadiusKm * 1000;
  }, [props]);

  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 150) return;
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

  const handleContainerClick = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.scrollWheelZoom.enable();
    }
  };

  const handleMouseLeave = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.scrollWheelZoom.disable();
    }
  };

  return (
    <div
      id="site-area-map-container"
      onClick={handleContainerClick}
      onMouseLeave={handleMouseLeave}
      className="relative h-[300px] w-full overflow-hidden rounded-lg border border-white/15 bg-black sm:h-[360px]"
    >
      <MapContainer
        center={initialCenter}
        className="h-full w-full"
        scrollWheelZoom={false}
        zoom={props.mode === "planner" ? 13 : 11}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
      >
        <MapInstanceHolder onMap={(m) => { mapInstanceRef.current = m; }} />
        <TileLayer attribution={ESRI_DARK_TILES.attribution} url={ESRI_DARK_TILES.base} />
        <TileLayer url={ESRI_DARK_TILES.reference} />

        <MapClickHandler onClick={handleMapClick} />
        <MapBoundsController
          city={props.city}
          centerLat={props.mode === "gov" ? props.centerLat : props.circleCenterLat}
          centerLng={props.mode === "gov" ? props.centerLng : props.circleCenterLng}
          radiusMeters={radiusMeters}
        />

        {props.mode === "gov" && (
          <>
            {props.centerLat != null && props.centerLng != null && (
              <Marker
                icon={centerMarkerIcon}
                position={[props.centerLat, props.centerLng]}
                interactive={false}
              />
            )}
            {props.centerLat != null && props.centerLng != null && props.radiusKm != null && props.radiusKm > 0 && (
              <Circle
                center={[props.centerLat, props.centerLng]}
                pathOptions={{
                  interactive: false,
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
                interactive: false,
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
              interactive={false}
            />
            {props.pinLat != null && props.pinLng != null && (
              <Marker
                icon={pinMarkerIcon}
                position={[props.pinLat, props.pinLng]}
                interactive={false}
              />
            )}
          </>
        )}
      </MapContainer>

      {props.onOpenFullMap && (
        <button
          type="button"
          id="open-full-map-btn"
          data-testid="open-full-map-btn"
          onClick={(e) => {
            e.stopPropagation();
            props.onOpenFullMap?.();
          }}
          className="absolute right-3 top-3 z-[400] flex items-center gap-1.5 rounded-md border border-cyan-400/40 bg-black/85 px-3 py-1.5 font-data-mono text-xs font-medium uppercase tracking-wider text-cyan-300 shadow-lg backdrop-blur hover:border-cyan-400 hover:bg-black hover:text-white"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          Open full map
        </button>
      )}
    </div>
  );
}
