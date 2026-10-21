"use client";

import { GovProject } from "@/services/gov";

interface GovDetailsSectionProps {
  project: GovProject;
}

export function GovDetailsSection({ project }: GovDetailsSectionProps) {
  return (
    <div className="space-y-[16px]">
      <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
        Details
      </h2>
      <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-4 rounded-[12px] border border-white/10 bg-surface-container-lowest/70 p-[16px]">
        <div>
          <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Category</p>
          <p className="mt-[2px] text-sm font-medium text-white">{project.category ?? "General"}</p>
        </div>
        <div>
          <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Budget</p>
          <p className="mt-[2px] font-data-mono text-sm font-semibold text-white">
            {project.budget != null ? `₹${Number(project.budget).toLocaleString("en-IN")}` : "N/A"}
          </p>
        </div>
        <div>
          <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Dates</p>
          <p className="mt-[2px] font-data-mono text-xs text-white">
            {project.start_date ?? "—"} to {project.end_date ?? "—"}
          </p>
        </div>
        <div>
          <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Assigned Planner</p>
          <p className="mt-[2px] font-data-mono text-xs text-primary font-semibold">
            {project.planner_name ?? (project.planner_id ? `Planner #${project.planner_id}` : "None")}
          </p>
        </div>
      </div>
    </div>
  );
}
