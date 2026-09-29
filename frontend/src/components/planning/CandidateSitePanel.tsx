"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CandidateSite,
  CandidateSiteDetail,
  ProximityItem,
  getCandidateSiteDetail,
  updateCandidateSiteStatus,
  refreshCandidateSiteProximity,
  promoteCandidateSite,
} from "@/services/studyAreas";

// Canonical enum values — must match backend VALID_STATUS_VALUES
export const STATUS_OPTIONS = {
  suitability_status: [
    "RequiresReview",
    "Suitable",
    "Unsuitable",
    "ConditionallyApproved",
    "Promoted",
  ],
  availability_status: [
    "VerificationRequired",
    "Available",
    "Unavailable",
    "UnderNegotiation",
  ],
  ownership_type: ["Unknown", "Government", "Private", "Mixed"],
  flood_risk: ["Unknown", "Low", "Medium", "High", "VeryHigh"],
} as const;

type StatusKey = keyof typeof STATUS_OPTIONS;

function suitabilityColor(val: string): string {
  if (val === "Suitable") return "#34d399";
  if (val === "Unsuitable") return "#f87171";
  if (val === "Promoted") return "#a78bfa";
  if (val === "ConditionallyApproved") return "#fbbf24";
  return "#22d3ee";
}

function floodColor(val: string): string {
  if (val === "Low") return "#34d399";
  if (val === "Medium") return "#fbbf24";
  if (val === "High") return "#f97316";
  if (val === "VeryHigh") return "#f87171";
  return "#94a3b8";
}

function amenityIcon(type: string): string {
  if (type === "hospital") return "🏥";
  if (type === "school") return "🏫";
  if (type === "road") return "🛣️";
  return "📍";
}

function distanceLabel(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastState = { message: string; kind: "success" | "error" } | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`absolute bottom-[24px] left-1/2 z-[1200] -translate-x-1/2 rounded-[12px] border px-[20px] py-[10px] font-data-mono text-[12px] shadow-xl transition-all ${
        toast.kind === "success"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/40 bg-red-500/10 text-red-400"
      }`}
    >
      {toast.kind === "success" ? "✓ " : "✗ "}
      {toast.message}
    </div>
  );
}

// ─── Proximity Section ────────────────────────────────────────────────────────

function ProximitySection({
  proximity,
  isRefreshing,
  onRefresh,
}: {
  proximity: ProximityItem[];
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const grouped: Record<string, ProximityItem[]> = {};
  for (const item of proximity) {
    (grouped[item.amenity_type] ??= []).push(item);
  }

  const amenityOrder = ["hospital", "school", "road"] as const;

  return (
    <div className="mt-[18px]">
      <div className="flex items-center justify-between">
        <p className="font-label-caps text-label-caps tracking-widest text-primary">
          PROXIMITY (2 KM RADIUS)
        </p>
        <button
          className="rounded-md border border-white/20 bg-white/5 px-[8px] py-[3px] font-data-mono text-[10px] uppercase text-on-surface-variant transition hover:border-primary-container/40 hover:text-primary disabled:opacity-40"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
        >
          {isRefreshing ? "..." : "↻ Refresh"}
        </button>
      </div>

      {proximity.length === 0 ? (
        <div className="mt-[10px] rounded-[10px] border border-white/10 bg-white/5 p-[12px] text-center font-data-mono text-[11px] text-on-surface-variant">
          {isRefreshing ? "Computing proximity data..." : "No data. Click Refresh to fetch from Overpass API."}
        </div>
      ) : (
        <div className="mt-[10px] flex flex-col gap-[10px]">
          {amenityOrder.map((type) => {
            const items = grouped[type];
            if (!items?.length) {
              return (
                <div key={type} className="rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
                  <p className="font-data-mono text-[10px] uppercase text-on-surface-variant">
                    {amenityIcon(type)} {type}
                  </p>
                  <p className="mt-[4px] font-data-mono text-[10px] text-on-surface-variant/50">
                    None found within 2 km
                  </p>
                </div>
              );
            }
            return (
              <div key={type} className="rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
                <p className="mb-[6px] font-data-mono text-[10px] uppercase text-on-surface-variant">
                  {amenityIcon(type)} {type}
                </p>
                <div className="flex flex-col gap-[4px]">
                  {items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="font-data-mono text-[11px] text-foreground">
                        {item.name ?? "(unnamed)"}
                      </span>
                      <span className="font-data-mono text-[10px] text-primary">
                        {distanceLabel(item.distance_meters)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {proximity.length > 0 && (
        <p className="mt-[6px] text-right font-data-mono text-[9px] text-on-surface-variant/40">
          Computed {new Date(proximity[0].computed_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// ─── Status Editor ────────────────────────────────────────────────────────────

function StatusEditor({
  site,
  isEditor,
  onUpdate,
}: {
  site: CandidateSiteDetail;
  isEditor: boolean;
  onUpdate: (updated: Partial<CandidateSiteDetail>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    suitability_status: site.suitability_status,
    availability_status: site.availability_status,
    ownership_type: site.ownership_type,
    flood_risk: site.flood_risk,
  });
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const updated = await updateCandidateSiteStatus(site.id, draft);
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const labels: Record<StatusKey, string> = {
    suitability_status: "Suitability",
    availability_status: "Availability",
    ownership_type: "Ownership",
    flood_risk: "Flood Risk",
  };

  return (
    <div className="mt-[18px]">
      <div className="flex items-center justify-between">
        <p className="font-label-caps text-label-caps tracking-widest text-primary">STATUS FIELDS</p>
        {isEditor && !editing && site.suitability_status !== "Promoted" && (
          <button
            className="rounded-md border border-white/20 bg-white/5 px-[8px] py-[3px] font-data-mono text-[10px] uppercase text-on-surface-variant transition hover:border-primary-container/40 hover:text-primary"
            onClick={() => setEditing(true)}
            type="button"
          >
            Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-[6px]">
            <button
              className="rounded-md border border-primary bg-primary/10 px-[8px] py-[3px] font-data-mono text-[10px] uppercase text-primary transition hover:bg-primary/20 disabled:opacity-40"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="rounded-md border border-white/20 bg-white/5 px-[8px] py-[3px] font-data-mono text-[10px] uppercase text-on-surface-variant transition hover:bg-white/10"
              disabled={saving}
              onClick={() => { setEditing(false); setError(""); }}
              type="button"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-[6px] font-data-mono text-[10px] text-red-400">{error}</p>
      )}

      <div className="mt-[10px] grid grid-cols-2 gap-[8px]">
        {(Object.keys(labels) as StatusKey[]).map((key) => (
          <div key={key} className="rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
            <p className="font-data-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
              {labels[key]}
            </p>
            {editing ? (
              <select
                className="mt-[4px] w-full rounded-[6px] border border-white/20 bg-surface-container-lowest px-[8px] py-[4px] font-data-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                id={`status-${key}-${site.id}`}
                value={draft[key]}
                onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
              >
                {STATUS_OPTIONS[key].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <p
                className="mt-[4px] font-data-mono text-[12px] font-medium"
                style={{
                  color:
                    key === "suitability_status"
                      ? suitabilityColor(site[key])
                      : key === "flood_risk"
                      ? floodColor(site[key])
                      : undefined,
                }}
              >
                {site[key]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Promote Dialog ───────────────────────────────────────────────────────────

function PromoteDialog({
  site,
  onConfirm,
  onCancel,
  promoting,
}: {
  site: CandidateSiteDetail;
  onConfirm: () => void;
  onCancel: () => void;
  promoting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card mx-[16px] w-full max-w-[440px] rounded-[20px] p-[28px] shadow-2xl">
        <div className="flex items-center gap-[12px]">
          <span className="text-[28px]">🚀</span>
          <div>
            <h2 className="font-display-md text-[18px] font-semibold text-foreground">
              Promote to Project?
            </h2>
            <p className="mt-[2px] font-data-mono text-[11px] text-on-surface-variant">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mt-[16px] rounded-[12px] border border-white/10 bg-white/5 p-[14px]">
          <p className="font-data-mono text-[11px] text-on-surface-variant">
            A new <strong className="text-foreground">Project</strong> will be created from:
          </p>
          <p className="mt-[8px] font-display-md text-[15px] font-medium text-foreground">
            {site.name}
          </p>
          <div className="mt-[8px] flex flex-col gap-[4px] font-data-mono text-[10px] text-on-surface-variant">
            <span>Coords: {site.location.coordinates[1].toFixed(5)}, {site.location.coordinates[0].toFixed(5)}</span>
            {site.area_size_acres && <span>Area: {site.area_size_acres} acres</span>}
          </div>
        </div>

        <div className="mt-[12px] rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-[10px] font-data-mono text-[11px] text-amber-400">
          ⚠ The site&apos;s suitability status will be set to <strong>Promoted</strong> and it will be linked to the new project.
        </div>

        <div className="mt-[20px] flex gap-[10px]">
          <button
            className="flex-1 rounded-[12px] border border-primary bg-primary py-[10px] font-data-mono text-[12px] font-semibold uppercase text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            disabled={promoting}
            onClick={onConfirm}
            type="button"
          >
            {promoting ? "Promoting..." : "Yes, Promote to Project"}
          </button>
          <button
            className="rounded-[12px] border border-white/20 bg-white/5 px-[16px] py-[10px] font-data-mono text-[12px] uppercase text-on-surface-variant transition hover:bg-white/10"
            disabled={promoting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface Props {
  site: CandidateSite;
  isEditor: boolean;
  onClose: () => void;
  onSiteUpdated: (site: CandidateSite) => void;
}

export function CandidateSitePanel({ site, isEditor, onClose, onSiteUpdated }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<CandidateSiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const data = await getCandidateSiteDetail(site.id);
      setDetail(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load site details.");
    } finally {
      setLoading(false);
    }
  }, [site.id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleStatusUpdated = useCallback(
    (updated: Partial<CandidateSiteDetail>) => {
      setDetail((prev) => prev ? { ...prev, ...updated } : prev);
      const merged = { ...site, ...updated } as CandidateSite;
      onSiteUpdated(merged);
      setToast({ message: "Status fields updated successfully.", kind: "success" });
    },
    [site, onSiteUpdated],
  );

  const handleRefreshProximity = useCallback(async () => {
    if (!detail) return;
    try {
      setIsRefreshing(true);
      const fresh = await refreshCandidateSiteProximity(detail.id);
      setDetail((prev) => prev ? { ...prev, proximity: fresh } : prev);
      setToast({ message: "Proximity data refreshed.", kind: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Proximity refresh failed.",
        kind: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [detail]);

  const handlePromote = useCallback(async () => {
    if (!detail) return;
    try {
      setPromoting(true);
      const result = await promoteCandidateSite(detail.id);
      setShowPromoteDialog(false);
      setToast({ message: `Promoted! Redirecting to project...`, kind: "success" });
      // Brief delay for toast visibility before redirect
      setTimeout(() => {
        router.push(`/projects/${result.project_id}`);
      }, 1200);
    } catch (err) {
      setShowPromoteDialog(false);
      setToast({
        message: err instanceof Error ? err.message : "Promotion failed.",
        kind: "error",
      });
    } finally {
      setPromoting(false);
    }
  }, [detail, router]);

  // Read promoted state exclusively from the gated detail fetch — not the site prop.
  const isPromoted = detail?.suitability_status === "Promoted" || !!detail?.promoted_project_id;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1050] bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="glass-card fixed top-0 right-0 z-[1100] flex h-full w-full max-w-[440px] flex-col overflow-hidden shadow-2xl"
        style={{ borderRadius: "20px 0 0 20px" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 p-[24px] pb-[16px]">
          <div className="flex-1 pr-[12px]">
            <p className="font-label-caps text-label-caps tracking-widest text-primary">
              CANDIDATE SITE
            </p>
            <h2 className="mt-[4px] font-display-md text-[20px] font-semibold leading-tight text-foreground">
              {site.name}
            </h2>
            {isPromoted && (
              <span className="mt-[6px] inline-block rounded-full border border-violet-500/40 bg-violet-500/10 px-[10px] py-[2px] font-data-mono text-[10px] text-violet-400">
                🚀 Promoted to Project
              </span>
            )}
          </div>
          <button
            className="rounded-full border border-white/20 bg-white/5 p-[8px] text-on-surface-variant transition hover:bg-white/10 hover:text-foreground"
            onClick={onClose}
            type="button"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-[24px] pt-[16px]">
          {/* ── Loading state ── */}
          {loading && (
            <div className="flex flex-col gap-[8px]">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[52px] animate-pulse rounded-[10px] border border-white/10 bg-white/5"
                />
              ))}
            </div>
          )}

          {/* ── Error / permission-denied state ──
               When loadError is set we render ONLY this block.
               No field values from `site` prop are exposed — the prop
               may contain data fetched before a role change, so we must
               not fall back to it here. */}
          {!loading && loadError && (
            <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 p-[16px]">
              <p className="font-data-mono text-[11px] font-semibold uppercase tracking-wider text-red-400">
                Access Denied
              </p>
              <p className="mt-[6px] font-data-mono text-[11px] text-red-400/80">
                {loadError}
              </p>
            </div>
          )}

          {/* ── All field data — only rendered when `detail` is confirmed ── */}
          {!loading && !loadError && detail && (
            <>
              {/* Basic Info — sourced from `detail`, not the `site` prop */}
              <div className="grid grid-cols-2 gap-[8px]">
                <div className="rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
                  <p className="font-data-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Area</p>
                  <p className="mt-[2px] font-data-mono text-[12px] text-foreground">
                    {detail.area_size_acres ? `${detail.area_size_acres} acres` : "Unspecified"}
                  </p>
                </div>
                <div className="rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
                  <p className="font-data-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Land Use</p>
                  <p className="mt-[2px] font-data-mono text-[12px] text-foreground">
                    {detail.land_use ?? "Unspecified"}
                  </p>
                </div>
                <div className="col-span-2 rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
                  <p className="font-data-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Coordinates</p>
                  <p className="mt-[2px] font-data-mono text-[11px] text-foreground">
                    {detail.location.coordinates[1].toFixed(5)}, {detail.location.coordinates[0].toFixed(5)}
                    <span className="ml-[6px] text-[9px] text-on-surface-variant">(lat, lng)</span>
                  </p>
                </div>
              </div>

              {detail.notes && (
                <div className="mt-[10px] rounded-[10px] border border-white/10 bg-white/5 p-[12px]">
                  <p className="font-data-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Notes</p>
                  <p className="mt-[4px] text-[12px] text-foreground">{detail.notes}</p>
                </div>
              )}

              <StatusEditor
                site={detail}
                isEditor={isEditor && !isPromoted}
                onUpdate={handleStatusUpdated}
              />

              <ProximitySection
                proximity={detail.proximity}
                isRefreshing={isRefreshing}
                onRefresh={handleRefreshProximity}
              />

              <p className="mt-[16px] font-data-mono text-[10px] text-on-surface-variant/50">
                Created {new Date(detail.created_at).toLocaleString()}
              </p>
            </>
          )}
        </div>

        {/* Footer — Promote button */}
        {isEditor && !isPromoted && (
          <div className="border-t border-white/10 p-[20px]">
            <button
              className="w-full rounded-[14px] border border-violet-500/50 bg-violet-500/10 py-[12px] font-data-mono text-[12px] font-semibold uppercase tracking-wide text-violet-400 transition hover:bg-violet-500/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-40"
              disabled={loading || !!loadError}
              onClick={() => setShowPromoteDialog(true)}
              type="button"
            >
              🚀 Promote to Project
            </button>
          </div>
        )}
      </div>

      {/* Promote confirmation dialog */}
      {showPromoteDialog && detail && (
        <PromoteDialog
          site={detail}
          promoting={promoting}
          onConfirm={handlePromote}
          onCancel={() => setShowPromoteDialog(false)}
        />
      )}

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
