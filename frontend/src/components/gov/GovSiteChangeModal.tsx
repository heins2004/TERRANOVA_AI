"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PlaceSearchInput } from "@/components/common/PlaceSearchInput";
import { GovSiteAreaSection } from "@/components/gov/GovSiteAreaSection";
import { requestSiteChange } from "@/services/siteChange";

interface GovSiteChangeModalProps {
  projectId: number;
  initialCity?: string | null;
  initialCityName?: string | null;
  initialLat?: number | null;
  initialLng?: number | null;
  initialRadiusKm?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function GovSiteChangeModal({
  projectId,
  initialCity,
  initialCityName,
  initialLat,
  initialLng,
  initialRadiusKm,
  onClose,
  onSuccess,
}: GovSiteChangeModalProps) {
  const hasStoredCircle = initialLat != null && initialLng != null && initialRadiusKm != null;

  const [reason, setReason] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [cityLat, setCityLat] = useState<number | null>(null);
  const [cityLng, setCityLng] = useState<number | null>(null);

  const [circleLat, setCircleLat] = useState<number | null>(initialLat ?? null);
  const [circleLng, setCircleLng] = useState<number | null>(initialLng ?? null);
  const [circleRadiusKm, setCircleRadiusKm] = useState<number | null>(
    initialRadiusKm != null ? Number(initialRadiusKm) : 5.0
  );

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    textareaRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    if (trimmed.length > 500) {
      setError("Reason cannot exceed 500 characters.");
      return;
    }

    if (!hasStoredCircle) {
      if (circleLat == null || circleLng == null || circleRadiusKm == null) {
        setError("A circular site area (centre and radius) is required because this project has no existing site area.");
        return;
      }
    }

    if (circleRadiusKm != null && (circleRadiusKm < 0.5 || circleRadiusKm > 50.0)) {
      setError("Site area radius must be between 0.5 and 50 km inclusive.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await requestSiteChange(projectId, {
        reason: trimmed,
        city: city || undefined,
        city_name: cityName || undefined,
        circle_lat: circleLat != null ? circleLat : undefined,
        circle_lng: circleLng != null ? circleLng : undefined,
        circle_radius_km: circleRadiusKm != null ? circleRadiusKm : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request site change.");
    } finally {
      setSubmitting(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-[16px] bg-black/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-change-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-[12px] border border-white/10 bg-surface-container-lowest p-[20px] sm:p-[24px] shadow-2xl space-y-[16px] text-on-surface"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
          <h3 id="site-change-modal-title" className="font-sans text-[18px] font-bold text-white">
            Request Site Change
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white text-[18px] p-[4px] cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded border border-danger/40 bg-danger/10 p-[10px] font-data-mono text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-[16px]">
          <div>
            <label htmlFor="site-change-reason" className="block font-data-mono text-xs text-on-surface-variant uppercase mb-[6px]">
              Reason for site change (10-500 characters) *
            </label>
            <textarea
              id="site-change-reason"
              ref={textareaRef}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="Explain why the current site needs to be changed..."
              className="w-full rounded border border-white/15 bg-white/[0.04] p-[10px] text-sm text-white placeholder-on-surface-variant/50 focus:border-primary focus:outline-none"
              maxLength={500}
            />
            <div className="mt-[4px] flex justify-between font-data-mono text-[10px] text-on-surface-variant">
              <span>Min 10 characters</span>
              <span>{reason.trim().length} / 500</span>
            </div>
          </div>

          <div>
            <PlaceSearchInput
              id="site-change-city"
              label="City (Optional — search to change city)"
              initialCityName={initialCityName || undefined}
              initialCitySlug={initialCity || undefined}
              required={false}
              onSelectPlace={(place) => {
                setCity(place.citySlug);
                setCityName(place.cityName);
                setCityLat(place.lat);
                setCityLng(place.lng);
                if (error) setError("");
              }}
              onPlaceCleared={() => {
                setCity(null);
                setCityName(null);
                setCityLat(null);
                setCityLng(null);
              }}
            />
          </div>

          <GovSiteAreaSection
            city={city || initialCity}
            cityLat={cityLat}
            cityLng={cityLng}
            centerLat={circleLat}
            centerLng={circleLng}
            radiusKm={circleRadiusKm}
            onChange={(lat, lng, rad) => {
              setCircleLat(lat);
              setCircleLng(lng);
              setCircleRadiusKm(rad);
              if (error) setError("");
            }}
            canClear={hasStoredCircle}
          />

          <div className="flex items-center justify-end gap-[12px] pt-[8px]">
            <button
              type="button"
              id="gov-cancel-site-change-modal-btn"
              onClick={onClose}
              className="rounded border border-white/20 bg-white/5 px-[16px] py-[8px] font-data-mono text-xs text-white uppercase hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="gov-submit-site-change-btn"
              disabled={submitting || reason.trim().length < 10}
              className="rounded border border-primary-container bg-primary-container/25 px-[16px] py-[8px] font-data-mono text-xs font-semibold text-primary uppercase hover:bg-primary-container/35 disabled:opacity-50"
            >
              {submitting ? "Requesting..." : "Request Site Change"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
