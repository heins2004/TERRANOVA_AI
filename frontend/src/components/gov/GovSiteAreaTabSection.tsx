"use client";

import dynamic from "next/dynamic";
import { GovProject } from "@/services/gov";
import { SiteChange } from "@/services/siteChange";
import { GovSiteChangeCard } from "./GovSiteChangeCard";

const SiteAreaMap = dynamic(
  () => import("@/components/maps/SiteAreaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-white/10 bg-black/40 font-data-mono text-xs text-on-surface-variant">
        LOADING CANDIDATE SITE MAP...
      </div>
    ),
  }
);

interface GovSiteAreaTabSectionProps {
  project: GovProject;
  siteChange?: SiteChange | null;
  onRefresh?: () => void;
}

const EXCLUDED_STAGES = ["Draft", "Planner invited"];

export function GovSiteAreaTabSection({ project, siteChange, onRefresh }: GovSiteAreaTabSectionProps) {
  const isStageFromSiteProposed = !EXCLUDED_STAGES.includes(project.stage);
  const showCandidateBlock =
    isStageFromSiteProposed &&
    project.proposed_site_lat != null &&
    project.proposed_site_lng != null;

  const hasSiteArea =
    project.site_area_lat != null &&
    project.site_area_lng != null &&
    project.site_area_radius_km != null;

  const radiusKm =
    typeof project.site_area_radius_km === "number"
      ? project.site_area_radius_km
      : parseFloat(String(project.site_area_radius_km)) || 5.0;

  return (
    <div className="space-y-[16px]">
      <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
        Site area
      </h2>
      {showCandidateBlock && (
        <div
          id="gov-candidate-site-block"
          className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[12px]"
        >
          <p className="font-data-mono text-[11px] text-primary uppercase">CANDIDATE SITE</p>
          {project.proposed_site_name && (
            <h4 className="text-white font-medium text-[16px]">{project.proposed_site_name}</h4>
          )}
          {project.proposed_site_explanation && (
            <p className="text-sm text-on-surface-variant">{project.proposed_site_explanation}</p>
          )}
          <p className="font-data-mono text-[11px] text-on-surface-variant">
            COORDINATES: {project.proposed_site_lat!.toFixed(4)}, {project.proposed_site_lng!.toFixed(4)}
          </p>

          {hasSiteArea && (
            <div
              id="gov-candidate-site-map-wrapper"
              className="pointer-events-none select-none overflow-hidden rounded-lg border border-white/10"
            >
              <SiteAreaMap
                mode="planner"
                city={project.city}
                circleCenterLat={project.site_area_lat!}
                circleCenterLng={project.site_area_lng!}
                circleRadiusKm={radiusKm}
                pinLat={project.proposed_site_lat!}
                pinLng={project.proposed_site_lng!}
                onSetPin={() => {}}
                onOutsideClick={() => {}}
              />
            </div>
          )}

          <div className="pt-[4px]">
            <a
              id="gov-candidate-site-osm-link"
              href={`https://www.openstreetmap.org/?mlat=${project.proposed_site_lat}&mlon=${project.proposed_site_lng}#map=17/${project.proposed_site_lat}/${project.proposed_site_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-data-mono text-[11px] text-cyan-400 underline hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              View on map &rarr;
            </a>
          </div>
        </div>
      )}

      {siteChange && ["requested", "proposed", "approved", "rejected"].includes(siteChange.status) && (
        <GovSiteChangeCard
          projectId={project.id}
          change={siteChange}
          onRefresh={onRefresh || (() => {})}
        />
      )}
    </div>
  );
}
