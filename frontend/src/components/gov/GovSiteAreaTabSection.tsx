"use client";

import { GovProject } from "@/services/gov";

interface GovSiteAreaTabSectionProps {
  project: GovProject;
}

export function GovSiteAreaTabSection({ project }: GovSiteAreaTabSectionProps) {
  const isProposedOrReview = ["Site proposed", "Under consideration"].includes(project.stage);

  return (
    <div className="space-y-[16px]">
      <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
        Site area
      </h2>
      {isProposedOrReview && project.proposed_site_name && (
        <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[12px]">
          <p className="font-data-mono text-[11px] text-primary uppercase">CANDIDATE SITE</p>
          <h4 className="text-white font-medium text-[16px]">{project.proposed_site_name}</h4>
          {project.proposed_site_explanation && (
            <p className="text-sm text-on-surface-variant">{project.proposed_site_explanation}</p>
          )}
          {project.proposed_site_lat != null && (
            <p className="font-data-mono text-[11px] text-on-surface-variant">
              COORDINATES: {project.proposed_site_lat.toFixed(4)}, {project.proposed_site_lng?.toFixed(4)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
