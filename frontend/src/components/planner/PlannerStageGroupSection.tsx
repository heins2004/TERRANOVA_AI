"use client";

import React from "react";
import Link from "next/link";
import { PlannerProject } from "@/services/planner";
import { SiteReworkingBadge } from "@/components/common/SiteReworkingBadge";

export interface PlannerStageGroupConfig {
  key: string;
  label: string;
  stages: string[];
}

interface PlannerStageGroupSectionProps {
  group: PlannerStageGroupConfig;
  projects: PlannerProject[];
  loading: boolean;
}

export function PlannerStageGroupSection({
  group,
  projects,
  loading,
}: PlannerStageGroupSectionProps) {
  const stageProjects = projects.filter((p) => {
    if (group.key === "site-proposed") {
      return (
        p.stage === "Site proposed" ||
        p.stage === "Planner invited" ||
        (p.stage === "OpenForResponse" && Boolean(p.site_change_status))
      );
    }
    return group.stages.includes(p.stage);
  });

  return (
    <section>
      <div className="flex items-center gap-[10px] mb-[16px] border-b border-white/10 pb-[12px]">
        <span className="h-[6px] w-[6px] rounded-full bg-primary" />
        <h2 className="font-display-md text-[18px] font-semibold uppercase text-primary">
          {group.label} ({stageProjects.length})
        </h2>
      </div>

      {loading ? (
        <p className="mt-[16px] font-data-mono text-sm text-on-surface-variant">LOADING PROJECTS...</p>
      ) : stageProjects.length === 0 ? (
        <div className="mt-[16px] rounded-xl border border-white/10 bg-white/[0.02] p-[24px]">
          <p className="font-data-mono text-sm text-on-surface-variant">NO PROJECTS FOUND IN THIS STAGE.</p>
        </div>
      ) : (
        <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-3">
          {stageProjects.map((proj) => {
            const stageLabel = proj.stage === "Planner invited" ? "Site proposed" : proj.stage;
            return (
              <Link
                key={proj.id}
                href={`/planner/${proj.id}`}
                id={`planner-project-card-${proj.id}`}
                className="glass-card block rounded-xl border border-white/10 bg-white/[0.02] p-[20px] transition hover:border-primary-container/60 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-[10px]">
                  <span className="font-data-mono text-[10px] uppercase text-on-surface-variant">
                    #{proj.id} • {proj.city || "INDIA"}
                  </span>
                  <div className="flex flex-wrap items-center gap-[6px]">
                    <span className="rounded border border-primary-container/40 bg-primary-container/10 px-[6px] py-[2px] font-data-mono text-[10px] text-primary">
                      {stageLabel}
                    </span>
                    {proj.site_change_status && (
                      <SiteReworkingBadge status={proj.site_change_status} id={`planner-card-site-change-${proj.id}`} />
                    )}
                  </div>
                </div>

              <h3 className="mt-[8px] font-display-md text-[16px] font-medium text-foreground line-clamp-1">
                {proj.title}
              </h3>

              <p className="mt-[4px] text-xs text-on-surface-variant line-clamp-2">
                {proj.description || "No description provided."}
              </p>

              <div className="mt-[16px] flex items-center justify-between border-t border-white/10 pt-[10px] font-data-mono text-[11px] text-on-surface-variant">
                <span>CATEGORY: {proj.category || "GENERAL"}</span>
                <span className="text-primary hover:underline">VIEW &rarr;</span>
              </div>
            </Link>
          );
        })}
        </div>
      )}
    </section>
  );
}
