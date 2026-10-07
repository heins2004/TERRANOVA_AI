"use client";

import { useRef, useState } from "react";
import { proposeSite } from "@/services/planner";

interface SiteProposalFormProps {
  projectId: number;
  rejectionReason: string | null;
  onSuccess: () => void;
}

export function SiteProposalForm({
  projectId,
  rejectionReason,
  onSuccess,
}: SiteProposalFormProps) {
  const [siteName, setSiteName] = useState("");
  const [siteLat, setSiteLat] = useState("");
  const [siteLng, setSiteLng] = useState("");
  const [explanation, setExplanation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

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
      errors.lat = "Latitude is required.";
    } else if (lat < 6.0 || lat > 38.0) {
      errors.lat = "Latitude must be inside India (between 6.0 and 38.0).";
    }

    const lng = parseFloat(siteLng);
    if (isNaN(lng)) {
      errors.lng = "Longitude is required.";
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
        <div className="mb-[20px] rounded border border-danger/40 bg-danger/10 p-[14px]">
          <p className="font-data-mono text-xs text-danger">{generalError}</p>
        </div>
      )}

      <h3 className="font-display-md text-[18px] font-semibold uppercase tracking-wider text-foreground">
        Propose Site Location
      </h3>
      <p className="mt-[4px] text-xs text-on-surface-variant">
        Enter candidate site details inside India coordinates and technical justification.
      </p>

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

        <div className="grid gap-[16px] sm:grid-cols-2">
          <div>
            <label className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Latitude (6.0 - 38.0)
            </label>
            <input
              type="number"
              id="planner-site-lat"
              step="0.0001"
              placeholder="e.g. 28.6139"
              value={siteLat}
              onChange={(e) => setSiteLat(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-white/[0.03] px-[14px] py-[10px] font-data-mono text-sm text-foreground focus:border-primary-container/80 focus:outline-none"
            />
            {fieldErrors.lat && (
              <p className="mt-[4px] font-data-mono text-[11px] text-danger">{fieldErrors.lat}</p>
            )}
          </div>

          <div>
            <label className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Longitude (68.0 - 98.0)
            </label>
            <input
              type="number"
              id="planner-site-lng"
              step="0.0001"
              placeholder="e.g. 77.2090"
              value={siteLng}
              onChange={(e) => setSiteLng(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-white/[0.03] px-[14px] py-[10px] font-data-mono text-sm text-foreground focus:border-primary-container/80 focus:outline-none"
            />
            {fieldErrors.lng && (
              <p className="mt-[4px] font-data-mono text-[11px] text-danger">{fieldErrors.lng}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Site Explanation (20 - 1000 characters)
            </label>
            <span className="font-data-mono text-[10px] text-on-surface-variant">
              {explanation.trim().length} / 1000
            </span>
          </div>
          <textarea
            rows={4}
            id="planner-site-explanation"
            placeholder="Explain spatial suitability, accessibility, and environmental feasibility..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            maxLength={1000}
            className="mt-[6px] w-full rounded border border-white/15 bg-white/[0.03] px-[14px] py-[10px] text-sm text-foreground focus:border-primary-container/80 focus:outline-none"
          />
          {fieldErrors.explanation && (
            <p className="mt-[4px] font-data-mono text-[11px] text-danger">{fieldErrors.explanation}</p>
          )}
        </div>

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
    </div>
  );
}
