"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { getCityCoordinates } from "@/lib/cities";
import { computeDistanceMeters } from "./mapUtils";
import { FullScreenMapCanvas } from "./FullScreenMapCanvas";
import { ModalFooterControls } from "./ModalFooterControls";
import { ModalHeaderBar } from "./ModalHeaderBar";

export interface FullScreenGovProps {
  mode: "gov";
  city?: string;
  initialCenterLat: number | null;
  initialCenterLng: number | null;
  initialRadiusKm: number | null;
  onConfirm: (lat: number | null, lng: number | null, radiusKm: number | null) => void;
}

export interface FullScreenPlannerProps {
  mode: "planner";
  circleCenterLat: number;
  circleCenterLng: number;
  circleRadiusKm: number;
  initialPinLat: number | null;
  initialPinLng: number | null;
  onConfirm: (lat: number, lng: number) => void;
}

export type FullScreenMapModalProps = (FullScreenGovProps | FullScreenPlannerProps) & {
  isOpen: boolean;
  onClose: () => void;
  triggerButtonId?: string;
};

function FullScreenMapModalDialog(props: FullScreenMapModalProps) {
  const [tileMode, setTileMode] = useState<"dark" | "satellite">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [draftCenterLat, setDraftCenterLat] = useState<number | null>(
    props.mode === "gov" ? props.initialCenterLat : null
  );
  const [draftCenterLng, setDraftCenterLng] = useState<number | null>(
    props.mode === "gov" ? props.initialCenterLng : null
  );
  const [draftRadiusKm, setDraftRadiusKm] = useState<number>(
    props.mode === "gov" ? (props.initialRadiusKm ?? 5.0) : 5.0
  );
  const [radiusInput, setRadiusInput] = useState<string>(
    props.mode === "gov" ? String(props.initialRadiusKm ?? 5.0) : "5.0"
  );
  const [radiusError, setRadiusError] = useState<string>("");

  const [draftPinLat, setDraftPinLat] = useState<number | null>(
    props.mode === "planner" ? props.initialPinLat : null
  );
  const [draftPinLng, setDraftPinLng] = useState<number | null>(
    props.mode === "planner" ? props.initialPinLng : null
  );
  const [outsideMsg, setOutsideMsg] = useState<string>("");

  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleClose = useCallback(() => {
    props.onClose();
    if (props.triggerButtonId) {
      document.getElementById(props.triggerButtonId)?.focus();
    }
  }, [props]);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  const handleConfirm = () => {
    if (props.mode === "gov") {
      props.onConfirm(draftCenterLat, draftCenterLng, draftCenterLat != null ? draftRadiusKm : null);
    } else {
      if (draftPinLat != null && draftPinLng != null) {
        props.onConfirm(draftPinLat, draftPinLng);
      }
    }
    handleClose();
  };

  const handleRadiusChange = (val: string) => {
    setRadiusInput(val);
    const parsed = parseFloat(val);
    if (!val.trim()) {
      setRadiusError("Radius is required (0.5 to 50 km).");
    } else if (isNaN(parsed) || parsed < 0.5 || parsed > 50.0) {
      setRadiusError("Radius must be between 0.5 and 50 km inclusive.");
    } else {
      setRadiusError("");
      setDraftRadiusKm(parsed);
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    if (props.mode === "gov") {
      setDraftCenterLat(latlng.lat);
      setDraftCenterLng(latlng.lng);
    } else {
      const dist = computeDistanceMeters(
        props.circleCenterLat,
        props.circleCenterLng,
        latlng.lat,
        latlng.lng
      );
      if (dist <= props.circleRadiusKm * 1000) {
        setDraftPinLat(latlng.lat);
        setDraftPinLng(latlng.lng);
        setOutsideMsg("");
      } else {
        setOutsideMsg(
          `Click is outside the allowed site area (${(dist / 1000).toFixed(2)} km from centre). Please place your pin inside the ${props.circleRadiusKm} km circle.`
        );
      }
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchError("");
    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error("Search service failed");
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError(`No locations found in India for "${query}".`);
        return;
      }
      const item = data[0];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([parseFloat(item.lat), parseFloat(item.lon)], 12);
      }
    } catch {
      setSearchError("Unable to search location. Please check your connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const initialView: [number, number] = useMemo(() => {
    if (props.mode === "gov") {
      if (props.initialCenterLat != null && props.initialCenterLng != null) {
        return [props.initialCenterLat, props.initialCenterLng];
      }
      const c = getCityCoordinates(props.city);
      return [c.lat, c.lng];
    }
    return [props.circleCenterLat, props.circleCenterLng];
  }, [props]);

  return (
    <div
      id="full-screen-map-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-0 backdrop-blur-md sm:p-4"
    >
      <div className="flex h-full w-full flex-col overflow-hidden border border-white/20 bg-[#0b0f17] shadow-2xl sm:h-[88vh] sm:max-w-5xl sm:rounded-2xl">
        <ModalHeaderBar
          mode={props.mode}
          tileMode={tileMode}
          onToggleTileMode={() => setTileMode((m) => (m === "dark" ? "satellite" : "dark"))}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={handleSearch}
          isSearching={isSearching}
          onClose={handleClose}
        />

        {searchError && (
          <div id="map-modal-search-error" className="bg-danger/20 border-b border-danger/30 px-4 py-1.5 font-data-mono text-xs text-danger">
            {searchError}
          </div>
        )}

        {props.mode === "gov" ? (
          <FullScreenMapCanvas
            mode="gov"
            initialView={initialView}
            tileMode={tileMode}
            draftCenterLat={draftCenterLat}
            draftCenterLng={draftCenterLng}
            draftRadiusKm={draftRadiusKm}
            onMapClick={handleMapClick}
            onMapReady={(m) => { mapInstanceRef.current = m; }}
          />
        ) : (
          <FullScreenMapCanvas
            mode="planner"
            initialView={initialView}
            tileMode={tileMode}
            circleCenterLat={props.circleCenterLat}
            circleCenterLng={props.circleCenterLng}
            circleRadiusKm={props.circleRadiusKm}
            draftPinLat={draftPinLat}
            draftPinLng={draftPinLng}
            onMapClick={handleMapClick}
            onMapReady={(m) => { mapInstanceRef.current = m; }}
          />
        )}

        {props.mode === "gov" ? (
          <ModalFooterControls
            mode="gov"
            draftCenterLat={draftCenterLat}
            draftCenterLng={draftCenterLng}
            draftRadiusKm={draftRadiusKm}
            radiusInput={radiusInput}
            radiusError={radiusError}
            onClearCenter={() => { setDraftCenterLat(null); setDraftCenterLng(null); }}
            onSliderChange={(num) => { setDraftRadiusKm(num); setRadiusInput(String(num)); setRadiusError(""); }}
            onRadiusInputChange={handleRadiusChange}
            onCancel={handleClose}
            onConfirm={handleConfirm}
          />
        ) : (
          <ModalFooterControls
            mode="planner"
            draftPinLat={draftPinLat}
            draftPinLng={draftPinLng}
            outsideMsg={outsideMsg}
            onCancel={handleClose}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}

export default function FullScreenMapModal(props: FullScreenMapModalProps) {
  if (typeof document === "undefined" || !props.isOpen) return null;
  return createPortal(
    <FullScreenMapModalDialog {...props} />,
    document.body
  );
}
