"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { getCityCoordinates } from "@/lib/cities";

export function MapBoundsController({
  city,
  cityLat,
  cityLng,
  centerLat,
  centerLng,
  radiusMeters,
}: {
  city?: string | null;
  cityLat?: number | null;
  cityLng?: number | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusMeters?: number;
}) {
  const map = useMap();
  const prevCityRef = useRef<string | undefined>(city);
  const prevCityLatRef = useRef<number | null | undefined>(cityLat);
  const prevCityLngRef = useRef<number | null | undefined>(cityLng);
  const prevCenterRef = useRef<[number | null, number | null]>([centerLat, centerLng]);
  const prevRadiusRef = useRef<number | undefined>(radiusMeters);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!map) return;

    const cityChanged = prevCityRef.current !== city;
    const cityCoordsChanged =
      prevCityLatRef.current !== cityLat || prevCityLngRef.current !== cityLng;
    const centerChanged =
      prevCenterRef.current[0] !== centerLat || prevCenterRef.current[1] !== centerLng;
    const radiusChanged = prevRadiusRef.current !== radiusMeters;

    prevCityRef.current = city;
    prevCityLatRef.current = cityLat;
    prevCityLngRef.current = cityLng;
    prevCenterRef.current = [centerLat, centerLng];
    prevRadiusRef.current = radiusMeters;

    // Case 1: Center placed and radius exists -> fit bounds
    if (centerLat != null && centerLng != null && radiusMeters && radiusMeters > 0) {
      if (isInitialMount.current || centerChanged || radiusChanged) {
        const latDelta = radiusMeters / 111320;
        const lngDelta = radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180));
        const bounds = L.latLngBounds(
            [centerLat - latDelta, centerLng - lngDelta],
            [centerLat + latDelta, centerLng + lngDelta]
        );
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }
    } else if (centerLat != null && centerLng != null) {
      // Case 2: Center placed but no radius
      if (isInitialMount.current || centerChanged) {
        map.setView([centerLat, centerLng], map.getZoom() || 12);
      }
    } else {
      // Case 3: No center placed -> Recentre to city/place when place changes or on initial mount
      if (isInitialMount.current || cityChanged || cityCoordsChanged) {
        if (cityLat != null && cityLng != null) {
          map.setView([cityLat, cityLng], 12);
        } else {
          const cityCoords = getCityCoordinates(city);
          map.setView([cityCoords.lat, cityCoords.lng], 11);
        }
      }
    }

    isInitialMount.current = false;
  }, [map, city, cityLat, cityLng, centerLat, centerLng, radiusMeters]);

  return null;
}
