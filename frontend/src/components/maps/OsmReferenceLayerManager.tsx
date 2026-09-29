"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  fetchOsmLayers,
  OsmFeatureCollection,
  OsmGeoJsonFeature,
  OsmLayerType,
} from "@/services/osmReferenceLayers";

export type ActiveOsmLayers = {
  road: boolean;
  school: boolean;
  hospital: boolean;
};

interface OsmReferenceLayerManagerProps {
  activeLayers: ActiveOsmLayers;
  onLoadingChange?: (loading: boolean) => void;
  onZoomWarningChange?: (tooZoomedOut: boolean) => void;
}

const MIN_ZOOM_THRESHOLD = 13;
const DEBOUNCE_DELAY_MS = 750;

export default function OsmReferenceLayerManager({
  activeLayers,
  onLoadingChange,
  onZoomWarningChange,
}: OsmReferenceLayerManagerProps) {
  const map = useMap();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeLayersRef = useRef<ActiveOsmLayers>(activeLayers);
  activeLayersRef.current = activeLayers;

  const roadLayerRef = useRef<L.GeoJSON | null>(null);
  const schoolLayerRef = useRef<L.GeoJSON | null>(null);
  const hospitalLayerRef = useRef<L.GeoJSON | null>(null);

  // Initialize Leaflet GeoJSON layer groups once
  useEffect(() => {
    if (!map) return;

    // 1. Road layer setup
    const roadLayer = L.geoJSON(null, {
      style: (feature) => {
        const feat = feature as OsmGeoJsonFeature;
        const hw = feat?.properties?.highway;
        let color = "#38bdf8"; // sky blue
        let weight = 2;
        let opacity = 0.8;

        if (hw === "motorway" || hw === "trunk") {
          color = "#f59e0b"; // amber
          weight = 3.5;
        } else if (hw === "primary") {
          color = "#38bdf8"; // bright cyan
          weight = 3;
        } else if (hw === "secondary") {
          color = "#60a5fa"; // blue
          weight = 2.5;
        } else if (hw === "tertiary") {
          color = "#93c5fd"; // light blue
          weight = 2;
        } else {
          color = "#94a3b8"; // slate
          weight = 1.5;
          opacity = 0.65;
        }

        return { color, weight, opacity };
      },
      onEachFeature: (feature, layer) => {
        const feat = feature as OsmGeoJsonFeature;
        const name = feat?.properties?.name || feat?.properties?.highway || "Road";
        const hwType = feat?.properties?.highway || "road";
        layer.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #0f172a; padding: 2px;">
            <div style="font-weight: 600; color: #0284c7;">${name}</div>
            <div style="color: #64748b; font-size: 11px; text-transform: capitalize;">Class: ${hwType}</div>
          </div>
        `);
      },
    });

    // 2. School layer setup
    const schoolLayer = L.geoJSON(null, {
      pointToLayer: (feature, latlng) => {
        const icon = L.divIcon({
          className: "terranova-osm-school-marker",
          html: `<div style="
            background: linear-gradient(135deg, #10b981, #059669);
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 8px rgba(16,185,129,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 10px;
          ">&#127891;</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10],
        });
        return L.marker(latlng, { icon });
      },
      onEachFeature: (feature, layer) => {
        const feat = feature as OsmGeoJsonFeature;
        const name = feat?.properties?.name || "School / Educational Institution";
        const amenity = feat?.properties?.amenity || "school";
        layer.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #0f172a; padding: 2px;">
            <div style="font-weight: 600; color: #059669;">${name}</div>
            <div style="color: #64748b; font-size: 11px; text-transform: capitalize;">Amenity: ${amenity}</div>
          </div>
        `);
      },
    });

    // 3. Hospital layer setup
    const hospitalLayer = L.geoJSON(null, {
      pointToLayer: (feature, latlng) => {
        const icon = L.divIcon({
          className: "terranova-osm-hospital-marker",
          html: `<div style="
            background: linear-gradient(135deg, #ef4444, #dc2626);
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 8px rgba(239,68,68,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 10px;
          ">&#127973;</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10],
        });
        return L.marker(latlng, { icon });
      },
      onEachFeature: (feature, layer) => {
        const feat = feature as OsmGeoJsonFeature;
        const name = feat?.properties?.name || "Hospital / Medical Center";
        const amenity = feat?.properties?.amenity || "hospital";
        layer.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #0f172a; padding: 2px;">
            <div style="font-weight: 600; color: #dc2626;">${name}</div>
            <div style="color: #64748b; font-size: 11px; text-transform: capitalize;">Amenity: ${amenity}</div>
          </div>
        `);
      },
    });

    roadLayerRef.current = roadLayer;
    schoolLayerRef.current = schoolLayer;
    hospitalLayerRef.current = hospitalLayer;

    return () => {
      if (map.hasLayer(roadLayer)) map.removeLayer(roadLayer);
      if (map.hasLayer(schoolLayer)) map.removeLayer(schoolLayer);
      if (map.hasLayer(hospitalLayer)) map.removeLayer(hospitalLayer);
      roadLayerRef.current = null;
      schoolLayerRef.current = null;
      hospitalLayerRef.current = null;
    };
  }, [map]);

  // Handle map add/remove when activeLayers toggle state changes
  useEffect(() => {
    if (!map) return;

    if (roadLayerRef.current) {
      if (activeLayers.road && !map.hasLayer(roadLayerRef.current)) {
        map.addLayer(roadLayerRef.current);
      } else if (!activeLayers.road && map.hasLayer(roadLayerRef.current)) {
        map.removeLayer(roadLayerRef.current);
      }
    }

    if (schoolLayerRef.current) {
      if (activeLayers.school && !map.hasLayer(schoolLayerRef.current)) {
        map.addLayer(schoolLayerRef.current);
      } else if (!activeLayers.school && map.hasLayer(schoolLayerRef.current)) {
        map.removeLayer(schoolLayerRef.current);
      }
    }

    if (hospitalLayerRef.current) {
      if (activeLayers.hospital && !map.hasLayer(hospitalLayerRef.current)) {
        map.addLayer(hospitalLayerRef.current);
      } else if (!activeLayers.hospital && map.hasLayer(hospitalLayerRef.current)) {
        map.removeLayer(hospitalLayerRef.current);
      }
    }
  }, [map, activeLayers.road, activeLayers.school, activeLayers.hospital]);

  // Fetch logic with debounce
  const fetchLayers = async () => {
    if (!map) return;

    const currentZoom = map.getZoom();
    const isTooZoomedOut = currentZoom < MIN_ZOOM_THRESHOLD;
    onZoomWarningChange?.(isTooZoomedOut);

    const typesToFetch: OsmLayerType[] = [];
    if (activeLayersRef.current.road) typesToFetch.push("road");
    if (activeLayersRef.current.school) typesToFetch.push("school");
    if (activeLayersRef.current.hospital) typesToFetch.push("hospital");

    if (isTooZoomedOut || typesToFetch.length === 0) {
      return;
    }

    const bounds = map.getBounds();
    const center = map.getCenter();
    const rawLatSpan = bounds.getNorth() - bounds.getSouth();
    const rawLngSpan = bounds.getEast() - bounds.getWest();

    // Clamp the query box around the viewport center to at most 4x4 grid cells (~4.4km)
    // to strictly respect backend quantization limits and Overpass rate policies
    const halfLat = Math.min(rawLatSpan / 2, 0.02);
    const halfLng = Math.min(rawLngSpan / 2, 0.02);

    const minLat = center.lat - halfLat;
    const maxLat = center.lat + halfLat;
    const minLng = center.lng - halfLng;
    const maxLng = center.lng + halfLng;

    try {
      onLoadingChange?.(true);
      console.log(`[OSM Reference] Fetching layers: ${typesToFetch.join(", ")} around (${center.lat.toFixed(3)}, ${center.lng.toFixed(3)})`);
      const layers = await fetchOsmLayers({
        minLng,
        minLat,
        maxLng,
        maxLat,
        types: typesToFetch,
      });

      console.log("[OSM Reference] Received layer features:", {
        roads: layers.road?.features?.length || 0,
        schools: layers.school?.features?.length || 0,
        hospitals: layers.hospital?.features?.length || 0,
      });

      if (roadLayerRef.current && layers.road) {
        roadLayerRef.current.clearLayers();
        roadLayerRef.current.addData(layers.road as unknown as GeoJSON.GeoJsonObject);
      }

      if (schoolLayerRef.current && layers.school) {
        schoolLayerRef.current.clearLayers();
        schoolLayerRef.current.addData(layers.school as unknown as GeoJSON.GeoJsonObject);
      }

      if (hospitalLayerRef.current && layers.hospital) {
        hospitalLayerRef.current.clearLayers();
        hospitalLayerRef.current.addData(layers.hospital as unknown as GeoJSON.GeoJsonObject);
      }
    } catch (err) {
      console.warn("Error fetching OSM reference layers:", err);
    } finally {
      onLoadingChange?.(false);
    }
  };

  // Trigger fetch on moveend, zoomend, and when layers are toggled ON
  useEffect(() => {
    if (!map) return;

    const triggerDebouncedFetch = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchLayers();
      }, DEBOUNCE_DELAY_MS);
    };

    map.on("moveend", triggerDebouncedFetch);
    map.on("zoomend", triggerDebouncedFetch);

    // Also trigger immediately if any layer is active
    if (activeLayers.road || activeLayers.school || activeLayers.hospital) {
      triggerDebouncedFetch();
    }

    return () => {
      map.off("moveend", triggerDebouncedFetch);
      map.off("zoomend", triggerDebouncedFetch);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [map, activeLayers.road, activeLayers.school, activeLayers.hospital]);

  return null;
}
