"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { proposeSite } from "@/services/planner";
import { LegacyCoordinateInputs } from "./LegacyCoordinateInputs";
import { ProposalExplanationField } from "./ProposalExplanationField";
import { ProposalMapSection } from "./ProposalMapSection";

const FullScreenMapModal = dynamic(
  () => import("@/components/maps/FullScreenMapModal"),
  { ssr: false }
);

interface SiteProposalFormProps {
  projectId: number;
  rejectionReason: string | null;
  siteAreaLat?: number | null;
  siteAreaLng?: number | null;
  siteAreaRadiusKm?: number | null;
  fallbackLat?: number | null;
  fallbackLng?: number | null;
  onSubmitOverride?: (payload: { name: string; location_lat: number; location_lng: number; explanation: string }) => Promise<void>;
  submitButtonLabel?: string;
  onSuccess: () => void;
}

export function SiteProposalForm({
  projectId,
  rejectionReason,
  siteAreaLat,
  siteAreaLng,
  siteAreaRadiusKm,
  fallbackLat,
  fallbackLng,
  onSubmitOverride,
  submitButtonLabel,
  onSuccess,
}: SiteProposalFormProps) {
  const [siteName, setSiteName] = useState("");
  const [siteLat, setSiteLat] = useState("");
  const [siteLng, setSiteLng] = useState("");
  const [explanation, setExplanation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [outsideClickError, setOutsideClickError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const hasCircle = siteAreaLat != null && siteAreaLng != null && siteAreaRadiusKm != null;
  const centerLat = hasCircle ? siteAreaLat : (fallbackLat ?? siteAreaLat ?? 12.9716);
  const centerLng = hasCircle ? siteAreaLng : (fallbackLng ?? siteAreaLng ?? 77.5946);
  const radiusKm = hasCircle ? siteAreaRadiusKm : 5.0;
  const showMap = hasCircle || (fallbackLat != null && fallbackLng != null) || (siteAreaLat != null && siteAreaLng != null);

  function validateProposal(): boolean {
    const errors: Record<string, string> = {};
    const trimmedName = siteName.trim();
    if (!trimmedName) {
      errors.name = "Site name is required.";
    } else if (trimmedName.length > 200) {
      errors.name = "Site name cannot exceed 200 characters.";
    }

    const lat = parseFloat(siteLat);
    if (isNaN(lat)) {
      errors.lat = hasCircle
        ? "Please click inside the site area circle to place your candidate site pin."
        : "Please click on the map to place your candidate site pin.";
    } else if (lat < 6.0 || lat > 38.0) {
      errors.lat = "Latitude must be inside India (between 6.0 and 38.0).";
    }

    const lng = parseFloat(siteLng);
    if (isNaN(lng)) {
      errors.lng = hasCircle
        ? "Please click inside the site area circle to place your candidate site pin."
        : "Please click on the map to place your candidate site pin.";
    } else if (lng < 68.0 || lng > 98.0) {
      errors.lng = "Longitude must be inside India (between 68.0 and 98.0).";
    }

    const trimmedExp = explanation.trim();
    if (!trimmedExp) {
      errors.explanation = "Explanation is required.";
    } else if (trimmedExp.length < 20 || trimmedExp.length > 1000) {
      errors.explanation = "Explanation must be between 20 and 1000 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleProposeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!validateProposal()) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    setGeneralError("");

    const payload = {
      name: siteName.trim(),
      location_lat: parseFloat(siteLat),
      location_lng: parseFloat(siteLng),
      explanation: explanation.trim(),
    };

    try {
      if (onSubmitOverride) {
        await onSubmitOverride(payload);
      } else {
        await proposeSite(projectId, payload);
        onSuccess();
      }
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to submit site proposal.");
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  function handleSetPin(lat: number, lng: number) {
    setSiteLat(lat.toFixed(6));
    setSiteLng(lng.toFixed(6));
    setOutsideClickError("");
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.lat;
      delete next.lng;
      return next;
    });
  }

  function handleOutsideClick(distKm: number) {
    setOutsideClickError(
      `Click is outside the allowed site area (${distKm.toFixed(2)} km from centre). Please place your pin inside the ${radiusKm} km circle.`
    );
  }

  return (
    <div>
      {rejectionReason && (
        <div className="mb-[24px] rounded-lg border border-danger/40 bg-danger/10 p-[16px]">
          <span className="font-data-mono text-[11px] uppercase tracking-wider text-danger font-semibold">
            PREVIOUS PROPOSAL REJECTED BY OFFICIAL:
          </span>
          <p className="mt-[6px] text-sm text-foreground leading-relaxed">
            {rejectionReason}
          </p>
        </div>
      )}

      {generalError && (
        <div id="planner-propose-error" className="mb-[20px] rounded border border-danger/40 bg-danger/10 p-[14px]">
          <p className="font-data-mono text-xs text-danger">{generalError}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display-md text-[18px] font-semibold uppercase tracking-wider text-foreground">
            Propose Site Location
          </h3>
          <p className="mt-[4px] text-xs text-on-surface-variant">
            {hasCircle
              ? `Click inside the ${radiusKm} km circular site area to place your candidate site pin.`
              : "Click on the map centered on the project location to place your candidate site pin."}
          </p>
        </div>

        {showMap && (
          <button
            type="button"
            id="planner-open-full-map-btn"
            data-testid="open-full-map-btn"
            onClick={() => setIsModalOpen(true)}
            className="rounded border border-primary/40 bg-primary/10 px-[12px] py-[6px] font-data-mono text-[11px] uppercase tracking-wider text-primary hover:bg-primary/20"
          >
            Open Full Map
          </button>
        )}
      </div>

      <form onSubmit={handleProposeSubmit} className="mt-[20px] space-y-[16px]">
        <div>
          <label className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
            Site Name
          </label>
          <input
            type="text"
            id="planner-site-name"
            placeholder="e.g. North Hub Development Area"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            maxLength={200}
            className="mt-[6px] w-full rounded border border-white/15 bg-white/[0.03] px-[14px] py-[10px] text-sm text-foreground focus:border-primary-container/80 focus:outline-none"
          />
          {fieldErrors.name && (
            <p className="mt-[4px] font-data-mono text-[11px] text-danger">{fieldErrors.name}</p>
          )}
        </div>

        {showMap ? (
          <ProposalMapSection
            hasCircle={hasCircle}
            centerLat={centerLat}
            centerLng={centerLng}
            radiusKm={radiusKm}
            siteLat={siteLat}
            siteLng={siteLng}
            outsideClickError={outsideClickError}
            latError={fieldErrors.lat}
            onSetPin={handleSetPin}
            onOutsideClick={handleOutsideClick}
            onOpenFullMap={() => setIsModalOpen(true)}
          />
        ) : (
          <LegacyCoordinateInputs
            siteLat={siteLat}
            siteLng={siteLng}
            onLatChange={setSiteLat}
            onLngChange={setSiteLng}
            latError={fieldErrors.lat}
            lngError={fieldErrors.lng}
          />
        )}

        <ProposalExplanationField
          explanation={explanation}
          onChange={setExplanation}
          error={fieldErrors.explanation}
        />

        <div className="pt-[8px]">
          <button
            type="submit"
            id="planner-submit-proposal-btn"
            disabled={isLoading}
            className="rounded border border-primary-container bg-primary-container/20 px-[20px] py-[10px] font-data-mono text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary-container/30 disabled:opacity-50"
          >
            {isLoading ? "SUBMITTING PROPOSAL..." : submitButtonLabel || "SUBMIT SITE PROPOSAL"}
          </button>
        </div>
      </form>

      {showMap && (
        <FullScreenMapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode="planner"
          hasCircle={hasCircle}
          circleCenterLat={centerLat}
          circleCenterLng={centerLng}
          circleRadiusKm={radiusKm}
          initialPinLat={siteLat ? parseFloat(siteLat) : null}
          initialPinLng={siteLng ? parseFloat(siteLng) : null}
          onConfirm={handleSetPin}
          triggerButtonId="planner-open-full-map-btn"
        />
      )}
    </div>
  );
}
