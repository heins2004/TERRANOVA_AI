"use client";

import Link from "next/link";
import { GovProject } from "@/services/gov";

export interface StageGroupConfig {
  key: string;
  label: string;
  stages: string[];
}

interface GovStageGroupSectionProps {
  group: StageGroupConfig;
  projects: GovProject[];
}

export function GovStageGroupSection({ group, projects }: GovStageGroupSectionProps) {
  const groupProjects = projects.filter((p) => group.stages.includes(p.stage));

  return (
    <section key={group.key} className="space-y-[16px]">
      <div className="flex items-center gap-[12px]">
        <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
          {group.label}
        </h2>
        <span className="rounded-full border border-white/15 bg-white/5 px-[8px] py-[2px] font-data-mono text-[11px] text-on-surface-variant">
          {groupProjects.length}
        </span>
      </div>

      {groupProjects.length === 0 ? (
        <div className="rounded border border-dashed border-white/10 p-[20px] text-center">
          <p className="font-data-mono text-[12px] text-on-surface-variant">
            NO PROJECTS IN THIS STAGE
          </p>
        </div>
      ) : (
        <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
          {groupProjects.map((project) => (
            <Link
              key={project.id}
              href={`/gov/${project.id}`}
              id={`gov-project-card-${project.id}`}
              className="group block rounded-[12px] border border-white/10 bg-surface-container-lowest/90 p-[20px] transition-all hover:border-primary/50 hover:bg-white/[0.03] hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
            >
              <div className="flex items-start justify-between gap-[10px]">
                <span className="rounded border border-primary-container/40 bg-primary-container/10 px-[8px] py-[3px] font-data-mono text-[10px] font-semibold text-primary uppercase">
                  {project.stage}
                </span>
                <span className="font-data-mono text-[11px] uppercase text-on-surface-variant">
                  {project.city ?? "No City"}
                </span>
              </div>

              <h3 className="mt-[12px] font-sans text-[16px] font-semibold text-white line-clamp-1 group-hover:text-primary transition-colors">
                {project.title}
              </h3>

              {project.description && (
                <p className="mt-[6px] text-[13px] text-on-surface-variant line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="mt-[16px] pt-[12px] border-t border-white/10 flex items-center justify-between text-[12px]">
                <div>
                  <span className="text-on-surface-variant font-data-mono text-[11px]">BUDGET: </span>
                  <span className="font-data-mono text-white font-semibold">
                    {project.budget != null ? `₹${Number(project.budget).toLocaleString("en-IN")}` : "Not set"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-on-surface-variant font-data-mono text-[11px]">PLANNER: </span>
                  <span className="font-data-mono text-primary font-semibold">
                    {project.planner_name ?? (project.planner_id ? `ID #${project.planner_id}` : "Unassigned")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
