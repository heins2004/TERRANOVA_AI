"use client";

import { useRef, useState } from "react";
import { GovProject, GovProjectCreatePayload, updateGovProject } from "@/services/gov";
import { GovSiteAreaSection } from "@/components/gov/GovSiteAreaSection";
import { getKolkataToday, isDateInPast, isEndAfterStart } from "@/lib/dateRules";
import { DateTimeInput } from "@/components/common/DateTimeInput";
import { PlaceSearchInput } from "@/components/common/PlaceSearchInput";

interface GovEditModalProps {
  project: GovProject;
  onClose: () => void;
  onSuccess: () => void;
}

export function GovEditModal({ project, onClose, onSuccess }: GovEditModalProps) {
  const initialStartDate = project.start_date || "";
  const initialEndDate = project.end_date || "";

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [city, setCity] = useState(project.city || "");
  const [cityName, setCityName] = useState(project.city_name || "");
  const [cityLat, setCityLat] = useState<number | null>(project.location_lat ?? null);
  const [cityLng, setCityLng] = useState<number | null>(project.location_lng ?? null);
  const [isCityValid, setIsCityValid] = useState(true);
  const [budget, setBudget] = useState(project.budget != null ? String(project.budget) : "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [siteAreaLat, setSiteAreaLat] = useState<number | null>(project.site_area_lat ?? null);
  const [siteAreaLng, setSiteAreaLng] = useState<number | null>(project.site_area_lng ?? null);
  const [siteAreaRadiusKm, setSiteAreaRadiusKm] = useState<number | null>(
    project.site_area_radius_km != null ? Number(project.site_area_radius_km) : null
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const canEditCity = project.stage === "Draft" || project.stage === "Planner invited";

  const minStartDate = getKolkataToday();
  const canEditSiteArea = project.stage === "Draft" || project.stage === "Planner invited";
  const canClearSiteArea = project.stage === "Draft";

  function handleSiteAreaChange(lat: number | null, lng: number | null, rad: number | null) {
    setSiteAreaLat(lat);
    setSiteAreaLng(lng);
    setSiteAreaRadiusKm(rad);
  }

  const startDateChanged = startDate !== initialStartDate;
  const endDateChanged = endDate !== initialEndDate;

  const startDateInlineError =
    startDate && startDateChanged && isDateInPast(startDate)
      ? "Start date must be today or in the future."
      : "";

  const endDateInlineError =
    (startDateChanged || endDateChanged) && startDate && endDate && !isEndAfterStart(startDate, endDate)
      ? "End date must be after start date."
      : "";

  const isDateBlocked = Boolean(startDateInlineError || endDateInlineError);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    if (canEditCity && (!city || !cityName || !isCityValid)) {
      setError("City is required. Please select a place from the search results.");
      return;
    }

    if (startDateChanged && startDate && isDateInPast(startDate)) {
      setError("Start date must be today or in the future.");
      return;
    }

    if ((startDateChanged || endDateChanged) && startDate && endDate && !isEndAfterStart(startDate, endDate)) {
      setError("End date must be after start date.");
      return;
    }

    if (canEditSiteArea) {
      const areaFields = [siteAreaLat, siteAreaLng, siteAreaRadiusKm];
      const nonNull = areaFields.filter((f) => f != null).length;
      if (nonNull > 0 && nonNull < 3) {
        setError("Site area latitude, longitude, and radius must all be set together.");
        return;
      }
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const payload: Partial<GovProjectCreatePayload> = {
        title: title.trim(),
        description: description.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
      };

      if (startDateChanged) {
        payload.start_date = startDate || undefined;
      }
      if (endDateChanged) {
        payload.end_date = endDate || undefined;
      }

      if (canEditCity && (city !== project.city || cityName !== project.city_name)) {
        payload.city = city;
        payload.city_name = cityName;
        if (cityLat != null) payload.location_lat = cityLat;
        if (cityLng != null) payload.location_lng = cityLng;
      }

      if (canEditSiteArea) {
        payload.site_area_lat = siteAreaLat;
        payload.site_area_lng = siteAreaLng;
        payload.site_area_radius_km = siteAreaRadiusKm;
      }

      await updateGovProject(project.id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[16px] border border-white/15 bg-[#0a0e17] p-[24px] shadow-2xl space-y-[16px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
          <h3 className="font-sans text-[18px] font-semibold text-white">
            {project.stage === "Approved"
              ? "Final Edit (Approved Stage)"
              : project.stage === "Planner invited"
              ? "Edit Project & Site Area (Site Proposed)"
              : "Edit Project (Draft)"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div id="gov-edit-error" className="rounded border border-danger/40 bg-danger/10 p-[12px] text-danger text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-[16px]">
          <div>
            <label className="block text-sm font-medium text-white">Project Title</label>
            <input
              type="text"
              id="gov-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Description</label>
            <textarea
              rows={3}
              id="gov-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          {canEditCity ? (
            <div>
              <PlaceSearchInput
                id="gov-edit-city"
                label="City *"
                initialCityName={cityName || project.city_name}
                initialCitySlug={city || project.city}
                onSelectPlace={(place) => {
                  setCity(place.citySlug);
                  setCityName(place.cityName);
                  setCityLat(place.lat);
                  setCityLng(place.lng);
                  setIsCityValid(true);
                }}
                onValidityChange={(valid) => {
                  setIsCityValid(valid);
                }}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-white mb-[6px]">City (Locked)</label>
              <input
                type="text"
                id="gov-edit-city-locked"
                disabled
                value={project.city_name || project.city || ""}
                className="w-full rounded border border-white/10 bg-white/5 px-[14px] py-[10px] text-sm text-on-surface-variant font-data-mono cursor-not-allowed opacity-60"
              />
            </div>
          )}

          <div className="grid gap-[16px] sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-white">Budget (₹ INR)</label>
              <input
                type="number"
                id="gov-edit-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>

            <DateTimeInput
              id="gov-edit-start-date"
              label="Start Date"
              min={startDateChanged ? minStartDate : undefined}
              value={startDate}
              onChange={setStartDate}
              error={startDateInlineError}
              errorId="gov-edit-start-date-error"
            />

            <DateTimeInput
              id="gov-edit-end-date"
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              error={endDateInlineError}
              errorId="gov-edit-end-date-error"
            />
          </div>

          {canEditSiteArea && (
            <GovSiteAreaSection
              city={city}
              cityLat={cityLat}
              cityLng={cityLng}
              centerLat={siteAreaLat}
              centerLng={siteAreaLng}
              radiusKm={siteAreaRadiusKm}
              onChange={handleSiteAreaChange}
              canClear={canClearSiteArea}
            />
          )}

          <div className="flex justify-end gap-[12px] pt-[8px]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded border border-white/15 px-[14px] py-[8px] font-data-mono text-[12px] text-on-surface-variant uppercase hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="gov-edit-save-btn"
              disabled={submitting || isDateBlocked}
              className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase transition-all hover:bg-primary-container/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
