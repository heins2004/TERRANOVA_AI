"use client";

import { useState } from "react";
import { GovProject } from "@/services/gov";
import { GovPlannerSearch } from "./GovPlannerSearch";

interface GovPlannerTabSectionProps {
  project: GovProject;
  onRefresh: () => void;
}

export function GovPlannerTabSection({ project, onRefresh }: GovPlannerTabSectionProps) {
  const [nowTime] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));
  const deadlinePassed = Boolean(
    project.planner_deadline && nowTime > 0 && nowTime > new Date(project.planner_deadline).getTime()
  );

  return (
    <div className="space-y-[16px]">
      <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
        Planner
      </h2>

      {project.stage === "Draft" && (
        <GovPlannerSearch
          projectId={project.id}
          onSuccess={onRefresh}
          hasArea={Boolean(project.site_area_lat != null && project.site_area_lng != null && project.site_area_radius_km != null)}
        />
      )}

      {project.stage === "Planner invited" && !project.planner_id && (
        <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[16px]">
          <div>
            <span className="font-data-mono text-[11px] text-primary uppercase">INVITATION DISPATCHED</span>
            <p className="mt-[4px] text-sm text-white">
              Waiting for planner response. {project.planner_deadline ? `Deadline: ${new Date(project.planner_deadline).toLocaleDateString("en-IN")}` : ""}
            </p>
          </div>
          {deadlinePassed ? (
            <div className="border-t border-white/10 pt-[16px]">
              <div className="rounded bg-warning/10 border border-warning/30 p-[12px] mb-[12px] text-xs text-warning">
                Planner deadline has passed. You may now reassign this project to another active planner.
              </div>
              <GovPlannerSearch projectId={project.id} isReassign={true} onSuccess={onRefresh} />
            </div>
          ) : (
            <div className="border-t border-white/10 pt-[12px]">
              <p className="font-data-mono text-[11px] text-on-surface-variant">
                REASSIGNMENT DISABLED UNTIL PLANNER DEADLINE EXPIRES.
              </p>
            </div>
          )}
        </div>
      )}

      {Boolean(project.planner_id) && (
        <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[8px]">
          <span className="font-data-mono text-[11px] text-primary uppercase">ASSIGNED PLANNER</span>
          <p className="text-white font-medium text-[15px]">
            {project.planner_name
              ? `${project.planner_name} (ID: ${project.planner_id})`
              : `Planner #${project.planner_id}`}
          </p>
        </div>
      )}
    </div>
  );
}
