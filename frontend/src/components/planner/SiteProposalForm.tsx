"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { proposeSite } from "@/services/planner";
import { LegacyCoordinateInputs } from "./LegacyCoordinateInputs";
import { ProposalExplanationField } from "./ProposalExplanationField";

const SiteAreaMap = dynamic(
  () => import("@/components/maps/SiteAreaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-white/10 bg-black/40 font-data-mono text-xs text-on-surface-variant">
        LOADING PROPOSAL MAP...
      </div>
    ),
  }
);

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
  onSuccess: () => void;
}

export function SiteProposalForm({
  projectId,
  rejectionReason,
  siteAreaLat,
  siteAreaLng,
  siteAreaRadiusKm,
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

  const hasSiteArea =
    siteAreaLat != null && siteAreaLng != null && siteAreaRadiusKm != null;

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
      errors.lat = hasSiteArea
        ? "Please click inside the site area circle to place your candidate site pin."
        : "Latitude is required.";
    } else if (lat < 6.0 || lat > 38.0) {
      errors.lat = "Latitude must be inside India (between 6.0 and 38.0).";
    }

    const lng = parseFloat(siteLng);
    if (isNaN(lng)) {
      errors.lng = hasSiteArea
        ? "Please click inside the site area circle to place your candidate site pin."
        : "Longitude is required.";
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

    try {
      await proposeSite(projectId, {
        name: siteName.trim(),
        location_lat: parseFloat(siteLat),
        location_lng: parseFloat(siteLng),
        explanation: explanation.trim(),
      });
      onSuccess();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to propose site.");
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleSetPin(lat: number, lng: number) {
    setSiteLat(lat.toFixed(4));
    setSiteLng(lng.toFixed(4));
    setOutsideClickError("");
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.lat;
      delete copy.lng;
      return copy;
    });
  }

  function handleOutsideClick(distKm: number) {
    setOutsideClickError(
      `Click is outside the allowed site area (${distKm.toFixed(2)} km from centre). Please place your pin inside the ${siteAreaRadiusKm} km circle.`
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
            {hasSiteArea
              ? `Click inside the ${siteAreaRadiusKm} km circular site area to place your candidate site pin.`
              : "Enter candidate site details inside India coordinates and technical justification."}
          </p>
        </div>

        {hasSiteArea && (
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

        {hasSiteArea ? (
          <div className="space-y-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-data-mono text-[11px] uppercase tracking-wider text-primary">
                Candidate Site Area Map (Click inside circle to place pin)
              </label>
              <button
                type="button"
                id="planner-open-full-map-btn"
                data-testid="planner-open-full-map-btn"
                onClick={() => setIsModalOpen(true)}
                className="rounded border border-primary/40 bg-primary/10 px-[12px] py-[6px] font-data-mono text-[11px] uppercase tracking-wider text-primary hover:bg-primary/20"
              >
                Open Full Map
              </button>
            </div>

            <SiteAreaMap
              mode="planner"
              circleCenterLat={siteAreaLat}
              circleCenterLng={siteAreaLng}
              circleRadiusKm={siteAreaRadiusKm}
              pinLat={siteLat ? parseFloat(siteLat) : null}
              pinLng={siteLng ? parseFloat(siteLng) : null}
              onSetPin={handleSetPin}
              onOutsideClick={handleOutsideClick}
              onOpenFullMap={() => setIsModalOpen(true)}
            />

            {outsideClickError && (
              <div id="planner-outside-click-msg" className="rounded border border-danger/40 bg-danger/10 p-[10px] font-data-mono text-xs text-danger">
                {outsideClickError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between rounded border border-white/10 bg-white/[0.02] p-[12px] font-data-mono text-xs">
              <span className="text-on-surface-variant">PIN LOCATION:</span>
              <span id="planner-pin-readout" className="text-primary font-semibold">
                {siteLat && siteLng ? `${siteLat}, ${siteLng}` : "No pin placed (click inside circle)"}
              </span>
            </div>
            {fieldErrors.lat && (
              <p className="font-data-mono text-[11px] text-danger">{fieldErrors.lat}</p>
            )}
          </div>
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
            {isLoading ? "SUBMITTING PROPOSAL..." : "SUBMIT SITE PROPOSAL"}
          </button>
        </div>
      </form>

      {hasSiteArea && (
        <FullScreenMapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode="planner"
          circleCenterLat={siteAreaLat}
          circleCenterLng={siteAreaLng}
          circleRadiusKm={siteAreaRadiusKm}
          initialPinLat={siteLat ? parseFloat(siteLat) : null}
          initialPinLng={siteLng ? parseFloat(siteLng) : null}
          onConfirm={handleSetPin}
          triggerButtonId="planner-open-full-map-btn"
        />
      )}
    </div>
  );
}
