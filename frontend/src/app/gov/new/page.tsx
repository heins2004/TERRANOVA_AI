"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { createGovProject, GovProjectCreatePayload } from "@/services/gov";
import { GovSiteAreaSection } from "@/components/gov/GovSiteAreaSection";
import { SUPPORTED_CITIES } from "@/lib/cities";
import { GovNewDatesBudget } from "@/components/gov/GovNewDatesBudget";
import { isDateInPast, isEndAfterStart } from "@/lib/dateRules";

const CATEGORIES = ["Energy", "Transport", "Housing", "Water", "Green Space", "Waste Management", "Healthcare", "Education"];

export default function NewGovProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    title: "", description: "", category: "Energy", city: "delhi",
    location_lat: "28.6139", location_lng: "77.2090", budget: "10000000",
    start_date: "", end_date: "",
  });

  const [siteArea, setSiteArea] = useState<{ centerLat: number | null; centerLng: number | null; radiusKm: number | null }>({
    centerLat: null, centerLng: null, radiusKm: null,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required (1 to 200 characters, digits allowed).";
    } else if (formData.title.length > 200) {
      errors.title = "Title cannot exceed 200 characters.";
    }

    if (!formData.city) errors.city = "City is required.";

    const lat = Number(formData.location_lat);
    if (formData.location_lat !== "" && (isNaN(lat) || lat < 6.0 || lat > 38.0)) {
      errors.location_lat = "Latitude must be within India (6.0 to 38.0).";
    }

    const lng = Number(formData.location_lng);
    if (formData.location_lng !== "" && (isNaN(lng) || lng < 68.0 || lng > 98.0)) {
      errors.location_lng = "Longitude must be within India (68.0 to 98.0).";
    }

    if (formData.budget !== "") {
      const budgetNum = Number(formData.budget);
      if (isNaN(budgetNum) || budgetNum < 0) errors.budget = "Budget must be positive.";
    }

    if (formData.start_date && isDateInPast(formData.start_date)) {
      errors.start_date = "Start date must be today or in the future.";
    }

    if (formData.start_date && formData.end_date) {
      if (!isEndAfterStart(formData.start_date, formData.end_date)) {
        errors.end_date = "End date must be after start date.";
      }
    }

    const areaFields = [siteArea.centerLat, siteArea.centerLng, siteArea.radiusKm];
    const nonNull = areaFields.filter((f) => f != null).length;
    if (nonNull > 0 && nonNull < 3) {
      errors.site_area = "Site area latitude, longitude, and radius must all be set together.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!validate()) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    setServerError("");

    try {
      const payload: GovProjectCreatePayload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category || undefined,
        city: formData.city,
        location_lat: formData.location_lat ? Number(formData.location_lat) : undefined,
        location_lng: formData.location_lng ? Number(formData.location_lng) : undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        site_area_lat: siteArea.centerLat ?? undefined,
        site_area_lng: siteArea.centerLng ?? undefined,
        site_area_radius_km: siteArea.radiusKm ?? undefined,
      };

      const res = await createGovProject(payload);
      router.push(`/gov/${res.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create project.";
      setServerError(msg);
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-4xl px-[16px] py-[32px] sm:px-[24px]">
        <div className="mb-[24px] flex items-center justify-between">
          <div>
            <h1 className="font-display-md text-[24px] font-bold text-foreground">
              Create New Project
            </h1>
            <p className="mt-[4px] font-data-mono text-xs text-on-surface-variant">
              Initialize a project draft as Government Official ({user?.email ?? "Government"})
            </p>
          </div>
          <Link
            href="/gov"
            className="rounded border border-white/20 bg-surface px-[14px] py-[8px] font-data-mono text-xs text-on-surface-variant uppercase transition hover:bg-surface-bright hover:text-white"
          >
            Cancel
          </Link>
        </div>

        {serverError && (
          <div id="gov-create-error" className="mb-[24px] rounded border border-danger/40 bg-danger/10 p-[16px]">
            <p className="font-data-mono text-xs text-danger">{serverError}</p>
          </div>
        )}

        <div className="rounded-[14px] border border-white/10 bg-surface/30 p-[24px]">
          <form onSubmit={handleSubmit} className="space-y-[20px]">
            <div>
              <label className="block text-sm font-medium text-white">Project Title *</label>
              <input
                id="gov-input-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Bangalore North Solar Grid"
                className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[14px] py-[10px] text-sm text-white focus:border-primary focus:outline-none"
              />
              {fieldErrors.title && <p className="mt-[4px] text-[12px] text-danger">{fieldErrors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white">Description</label>
              <textarea
                id="gov-input-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed objectives and scope..."
                className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[14px] py-[10px] text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid gap-[16px] sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white">City *</label>
                <select
                  id="gov-new-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-[6px] w-full rounded border border-white/15 bg-[#0a0e17] px-[14px] py-[10px] text-sm text-white focus:border-primary focus:outline-none"
                >
                  {SUPPORTED_CITIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                {fieldErrors.city && <p className="mt-[4px] text-[12px] text-danger">{fieldErrors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Category</label>
                <select
                  id="gov-select-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-[6px] w-full rounded border border-white/15 bg-[#0a0e17] px-[14px] py-[10px] text-sm text-white focus:border-primary focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <GovSiteAreaSection
              city={formData.city}
              centerLat={siteArea.centerLat}
              centerLng={siteArea.centerLng}
              radiusKm={siteArea.radiusKm}
              onChange={(lat, lng, rad) =>
                setSiteArea({ centerLat: lat, centerLng: lng, radiusKm: rad })
              }
              canClear={true}
              error={fieldErrors.site_area}
            />

            <div className="grid gap-[16px] sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white">Latitude (India: 6.0 to 38.0)</label>
                <input
                  id="gov-input-lat"
                  type="number"
                  step="0.0001"
                  value={formData.location_lat}
                  onChange={(e) => setFormData({ ...formData, location_lat: e.target.value })}
                  className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[14px] py-[10px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
                />
                {fieldErrors.location_lat && <p className="mt-[4px] text-[12px] text-danger">{fieldErrors.location_lat}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Longitude (India: 68.0 to 98.0)</label>
                <input
                  id="gov-input-lng"
                  type="number"
                  step="0.0001"
                  value={formData.location_lng}
                  onChange={(e) => setFormData({ ...formData, location_lng: e.target.value })}
                  className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[14px] py-[10px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
                />
                {fieldErrors.location_lng && <p className="mt-[4px] text-[12px] text-danger">{fieldErrors.location_lng}</p>}
              </div>
            </div>

            <GovNewDatesBudget
              budget={formData.budget}
              startDate={formData.start_date}
              endDate={formData.end_date}
              onBudgetChange={(val) => setFormData({ ...formData, budget: val })}
              onStartDateChange={(val) => setFormData({ ...formData, start_date: val })}
              onEndDateChange={(val) => setFormData({ ...formData, end_date: val })}
              budgetError={fieldErrors.budget}
              startDateError={
                formData.start_date && isDateInPast(formData.start_date)
                  ? "Start date must be today or in the future."
                  : fieldErrors.start_date
              }
              endDateError={
                formData.start_date && formData.end_date && !isEndAfterStart(formData.start_date, formData.end_date)
                  ? "End date must be after start date."
                  : fieldErrors.end_date
              }
            />

            <div className="pt-[16px]">
              <button
                type="submit"
                id="gov-create-submit-btn"
                disabled={submitting}
                className="w-full rounded border border-primary-container bg-primary-container/20 py-[12px] font-data-mono text-[13px] font-semibold text-primary uppercase transition-all hover:bg-primary-container/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating Project..." : "Create Project (Draft)"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
