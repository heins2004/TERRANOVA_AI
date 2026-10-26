"use client";

import { useEffect } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  centerMarkerIcon,
  pinMarkerIcon,
  ESRI_DARK_TILES,
  ESRI_SATELLITE_TILES,
} from "./mapUtils";
import { MapBoundsController } from "./MapBoundsController";

function MapSearchController({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (container) {
      (container as unknown as { _leaflet_map: L.Map })._leaflet_map = map;
    }
    onMap(map);
  }, [map, onMap]);
  return null;
}

function ModalClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    function handleClick(e: L.LeafletMouseEvent) {
      onClick(e.latlng);
    }
    function handleDomClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest(".leaflet-control") || target.closest("button") || target.closest("a")) return;
      const pt = map.mouseEventToContainerPoint(e);
      const latlng = map.containerPointToLatLng(pt);
      onClick(latlng);
    }
    map.on("click", handleClick);
    const container = map.getContainer();
    container.addEventListener("click", handleDomClick);
    return () => {
      map.off("click", handleClick);
      container.removeEventListener("click", handleDomClick);
    };
  }, [map, onClick]);
  return null;
}

interface FullScreenMapCanvasGovProps {
  mode: "gov";
  initialView: [number, number];
  tileMode: "dark" | "satellite";
  draftCenterLat: number | null;
  draftCenterLng: number | null;
  draftRadiusKm: number;
  onMapClick: (latlng: L.LatLng) => void;
  onMapReady: (map: L.Map) => void;
}

interface FullScreenMapCanvasPlannerProps {
  mode: "planner";
  initialView: [number, number];
  tileMode: "dark" | "satellite";
  circleCenterLat: number;
  circleCenterLng: number;
  circleRadiusKm: number;
  draftPinLat: number | null;
  draftPinLng: number | null;
  onMapClick: (latlng: L.LatLng) => void;
  onMapReady: (map: L.Map) => void;
  hasCircle?: boolean;
}

interface FullScreenMapCanvasVenuePinProps {
  mode: "venue_pin";
  initialView: [number, number];
  tileMode: "dark" | "satellite";
  draftPinLat: number | null;
  draftPinLng: number | null;
  onMapClick: (latlng: L.LatLng) => void;
  onMapReady: (map: L.Map) => void;
}

export type FullScreenMapCanvasProps =
  | FullScreenMapCanvasGovProps
  | FullScreenMapCanvasPlannerProps
  | FullScreenMapCanvasVenuePinProps;

export function FullScreenMapCanvas(props: FullScreenMapCanvasProps) {
  const tileConfig = props.tileMode === "dark" ? ESRI_DARK_TILES : ESRI_SATELLITE_TILES;
  const boundsCenterLat = props.mode === "gov" ? props.draftCenterLat : (props.mode === "planner" && props.hasCircle !== false ? props.circleCenterLat : null);
  const boundsCenterLng = props.mode === "gov" ? props.draftCenterLng : (props.mode === "planner" && props.hasCircle !== false ? props.circleCenterLng : null);
  const boundsRadiusMeters = props.mode === "gov" ? (props.draftRadiusKm > 0 ? props.draftRadiusKm * 1000 : undefined) : (props.mode === "planner" && props.hasCircle !== false ? Number(props.circleRadiusKm) * 1000 : undefined);

  return (
    <div id="full-map-container" className="relative flex-1 w-full bg-black">
      <MapContainer
        center={props.initialView}
        zoom={props.mode === "planner" ? 13 : 11}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <MapSearchController onMap={props.onMapReady} />
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.base} />
        <TileLayer url={tileConfig.reference} />
        <ModalClickHandler onClick={props.onMapClick} />
        <MapBoundsController
          centerLat={boundsCenterLat}
          centerLng={boundsCenterLng}
          radiusMeters={boundsRadiusMeters}
        />

        {props.mode === "gov" && props.draftCenterLat != null && props.draftCenterLng != null && (
          <>
            <Marker
              position={[props.draftCenterLat, props.draftCenterLng]}
              icon={centerMarkerIcon}
              interactive={false}
            />
            {props.draftRadiusKm > 0 && (
              <Circle
                center={[props.draftCenterLat, props.draftCenterLng]}
                radius={props.draftRadiusKm * 1000}
                pathOptions={{
                  interactive: false,
                  color: "#22d3ee",
                  fillColor: "#22d3ee",
                  fillOpacity: 0.18,
                  weight: 2,
                }}
              />
            )}
          </>
        )}

        {props.mode === "planner" && (
          <>
            {props.hasCircle !== false && (
              <>
                <Circle
                  center={[props.circleCenterLat, props.circleCenterLng]}
                  radius={Number(props.circleRadiusKm) * 1000}
                  pathOptions={{
                    interactive: true,
                    color: "#22d3ee",
                    fillColor: "#22d3ee",
                    fillOpacity: 0.18,
                    weight: 2,
                  }}
                />
                <Marker
                  position={[props.circleCenterLat, props.circleCenterLng]}
                  icon={centerMarkerIcon}
                  interactive={false}
                />
              </>
            )}
            {props.draftPinLat != null && props.draftPinLng != null && (
              <Marker
                position={[props.draftPinLat, props.draftPinLng]}
                icon={pinMarkerIcon}
                interactive={false}
              />
            )}
          </>
        )}

        {props.mode === "venue_pin" && props.draftPinLat != null && props.draftPinLng != null && (
          <Marker
            position={[props.draftPinLat, props.draftPinLng]}
            icon={pinMarkerIcon}
            interactive={false}
          />
        )}
      </MapContainer>
    </div>
  );
}
