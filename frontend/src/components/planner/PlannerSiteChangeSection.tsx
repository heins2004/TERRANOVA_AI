"use client";

import dynamic from "next/dynamic";
import { SiteChange, proposeSiteChange } from "@/services/siteChange";
import { PlannerProject } from "@/services/planner";
import { SiteProposalForm } from "@/components/planner/SiteProposalForm";
import { SiteChangeInProgressBadge } from "@/components/gov/SiteChangeInProgressBadge";

const SiteAreaMap = dynamic(
  () => import("@/components/maps/SiteAreaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] w-full items-center justify-center rounded border border-white/10 bg-black/40 font-data-mono text-xs text-on-surface-variant">
        LOADING MAP...
      </div>
    ),
  }
);

interface PlannerSiteChangeSectionProps {
  projectId: number;
  change: SiteChange;
  project: PlannerProject;
  onRefresh: () => void;
}

export function PlannerSiteChangeSection({
  projectId,
  change,
  project,
  onRefresh,
}: PlannerSiteChangeSectionProps) {
  const isOpen = ["requested", "proposed", "approved", "rejected"].includes(change.status);
  if (!isOpen) return null;

  const circleLat = change.circle_lat ?? project.site_area_lat;
  const circleLng = change.circle_lng ?? project.site_area_lng;
  const circleRadius = change.circle_radius_km ?? project.site_area_radius_km;

  const hasProposedCoords =
    change.proposed_site_lat != null && change.proposed_site_lng != null;
  const osmUrl = hasProposedCoords
    ? `https://www.openstreetmap.org/?mlat=${change.proposed_site_lat}&mlon=${change.proposed_site_lng}#map=17/${change.proposed_site_lat}/${change.proposed_site_lng}`
    : "#";

  return (
    <div
      id="planner-site-change-section"
      className="glass-card rounded-xl border border-warning/30 bg-warning/[0.04] p-[24px] space-y-[20px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-[10px] border-b border-white/10 pb-[12px]">
        <div>
          <span className="font-data-mono text-[10px] uppercase text-warning tracking-wider">
            Site Change Request
          </span>
          <h3 className="font-sans text-[17px] font-semibold text-white">
            Official Site Change Request
          </h3>
        </div>
        <SiteChangeInProgressBadge status={change.status} />
      </div>

      <div className="space-y-[8px]">
        <div>
          <span className="block font-data-mono text-[10px] text-on-surface-variant uppercase">
            Official Reason for Change
          </span>
          <p className="text-sm text-white/90">{change.reason}</p>
        </div>

        {change.status === "rejected" && change.rejection_reason && (
          <div className="rounded border border-danger/40 bg-danger/10 p-[12px]">
            <span className="block font-data-mono text-[10px] text-danger uppercase mb-[4px]">
              Proposal Rejection Feedback
            </span>
            <p className="text-sm text-danger/90">{change.rejection_reason}</p>
          </div>
        )}
      </div>

      {(change.status === "requested" || change.status === "rejected") && (
        <div className="rounded-[8px] border border-white/10 bg-black/30 p-[16px] space-y-[12px]">
          <h4 className="font-sans text-[15px] font-semibold text-primary">
            Propose New Candidate Site
          </h4>
          <SiteProposalForm
            projectId={projectId}
            rejectionReason={change.rejection_reason ?? null}
            siteAreaLat={circleLat}
            siteAreaLng={circleLng}
            siteAreaRadiusKm={circleRadius}
            onSubmitOverride={async (payload) => {
              await proposeSiteChange(projectId, payload);
              onRefresh();
            }}
            onSuccess={onRefresh}
            submitButtonLabel="Submit Site Change Proposal"
          />
        </div>
      )}

      {change.status === "proposed" && (
        <div className="rounded-[8px] border border-white/10 bg-black/30 p-[16px] space-y-[12px]">
          <div className="flex items-center justify-between">
            <span className="font-data-mono text-[10px] uppercase text-primary tracking-wider">
              Submitted Candidate Site (Under Review)
            </span>
            <span className="font-data-mono text-[11px] text-warning">Awaiting official review</span>
          </div>

          {change.proposed_site_name && (
            <h5 className="font-sans text-[15px] font-semibold text-white">
              {change.proposed_site_name}
            </h5>
          )}
          {change.proposed_site_explanation && (
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {change.proposed_site_explanation}
            </p>
          )}

          {hasProposedCoords && (
            <>
              <div className="font-data-mono text-[11px] text-primary">
                COORDINATES: {change.proposed_site_lat!.toFixed(4)}, {change.proposed_site_lng!.toFixed(4)}
              </div>
              <div className="relative h-[200px] w-full rounded overflow-hidden border border-white/10">
                <SiteAreaMap
                  centerLat={change.proposed_site_lat!}
                  centerLng={change.proposed_site_lng!}
                  radiusKm={0.5}
                  readOnly={true}
                  pinLat={change.proposed_site_lat!}
                  pinLng={change.proposed_site_lng!}
                />
              </div>
              <a
                id="planner-site-change-osm-link"
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[4px] text-[12px] font-data-mono text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                VIEW ON MAP
              </a>
            </>
          )}
        </div>
      )}

      {change.status === "approved" && (
        <div className="rounded border border-primary-container/40 bg-primary-container/15 p-[14px] font-data-mono text-xs text-primary">
          Site change proposal approved by official. Awaiting redeployment by the government official.
        </div>
      )}
    </div>
  );
}
