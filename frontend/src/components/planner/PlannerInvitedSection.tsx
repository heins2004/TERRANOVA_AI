"use client";

import React from "react";
import Link from "next/link";
import { PlannerProject } from "@/services/planner";

interface PlannerInvitedSectionProps {
  projects: PlannerProject[];
  loading: boolean;
}

export function PlannerInvitedSection({
  projects,
  loading,
}: PlannerInvitedSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-[10px] mb-[16px] border-b border-white/10 pb-[12px]">
        <span className="h-[6px] w-[6px] rounded-full bg-primary" />
        <h2 className="font-display-md text-[18px] font-semibold uppercase text-primary">
          Planner Invited ({projects.length})
        </h2>
      </div>

      {loading ? (
        <p className="mt-[16px] font-data-mono text-sm text-on-surface-variant">LOADING PROJECTS...</p>
      ) : projects.length === 0 ? (
        <div className="mt-[16px] rounded-xl border border-white/10 bg-white/[0.02] p-[24px]">
          <p className="font-data-mono text-sm text-on-surface-variant">
            No accepted projects waiting for a site proposal.
          </p>
        </div>
      ) : (
        <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/planner/${proj.id}`}
              id={`planner-project-card-${proj.id}`}
              className="glass-card block rounded-xl border border-white/10 bg-white/[0.02] p-[20px] transition hover:border-primary-container/60 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-[10px]">
                <span className="font-data-mono text-[10px] uppercase text-on-surface-variant">
                  #{proj.id} • {proj.city || "ALL CITIES"}
                </span>
                <span className="rounded border border-primary-container/40 bg-primary-container/10 px-[6px] py-[2px] font-data-mono text-[10px] text-primary">
                  {proj.stage}
                </span>
              </div>

              <h3 className="mt-[8px] font-display-md text-[16px] font-medium text-foreground line-clamp-1">
                {proj.title}
              </h3>

              <p className="mt-[4px] text-xs text-on-surface-variant line-clamp-2">
                {proj.description || "No description provided."}
              </p>

              <div className="mt-[14px] space-y-[4px] border-t border-white/10 pt-[10px] font-data-mono text-[11px] text-on-surface-variant">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">BUDGET:</span>
                  <span className="font-semibold text-foreground">
                    {proj.budget != null ? `₹${Number(proj.budget).toLocaleString("en-IN")}` : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">DEADLINE:</span>
                  <span className="text-foreground">
                    {proj.planner_deadline
                      ? new Date(proj.planner_deadline).toLocaleString("en-IN")
                      : "No deadline"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">OFFICIAL:</span>
                  <span className="text-foreground">
                    {proj.official_name ?? "Government Official"}
                  </span>
                </div>
              </div>

              <div className="mt-[14px] flex items-center justify-end border-t border-white/10 pt-[10px] font-data-mono text-[11px]">
                <span
                  id={`planner-view-project-${proj.id}`}
                  className="text-primary hover:underline font-semibold"
                >
                  VIEW &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
