"use client";

import { UserProfile } from "@/services/profile";

type RoleSummaryCardProps = {
  profile: UserProfile;
};

export function RoleSummaryCard({ profile }: RoleSummaryCardProps) {
  const { role, counts } = profile;

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-[20px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
        <div className="flex items-center gap-[8px]">
          <span
            className="material-symbols-outlined text-[20px] text-primary-container"
            aria-hidden="true"
          >
            insights
          </span>
          <h2 className="font-display-md text-[16px] font-semibold text-on-surface">
            Role Summary
          </h2>
        </div>
        <span className="font-data-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
          {role}
        </span>
      </div>

      <div className="mt-[16px]">
        {/* Citizen Counts */}
        {role === "Citizen" && counts && "follows" in counts && (
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.03] p-[16px]">
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Followed Projects
              </span>
              <span className="mt-[4px] font-display-md text-[28px] font-bold text-primary">
                {counts.follows}
              </span>
            </div>
            <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.03] p-[16px]">
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Comments Posted
              </span>
              <span className="mt-[4px] font-display-md text-[28px] font-bold text-primary">
                {counts.comments}
              </span>
            </div>
          </div>
        )}

        {/* Urban Planner Counts */}
        {role === "Urban Planner" && counts && "pending_invites" in counts && (
          <div className="flex flex-col gap-[14px]">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-[14px]">
              <span className="font-data-mono text-[12px] uppercase tracking-wider text-on-surface-variant">
                Pending Invites
              </span>
              <span className="font-display-md text-[20px] font-bold text-primary-container">
                {counts.pending_invites}
              </span>
            </div>

            <div className="flex flex-col gap-[6px]">
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Assigned Projects by Stage
              </span>
              {Object.keys(counts.assigned_projects_by_stage || {}).length === 0 ? (
                <p className="font-body-md text-[13px] text-on-surface-variant/70 italic">
                  No projects currently assigned.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-[8px] sm:grid-cols-3">
                  {Object.entries(counts.assigned_projects_by_stage).map(
                    ([stage, count]) => (
                      <div
                        key={stage}
                        className="flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-[10px]"
                      >
                        <span className="truncate font-data-mono text-[10px] text-on-surface-variant">
                          {stage}
                        </span>
                        <span className="font-display-md text-[18px] font-bold text-on-surface">
                          {count}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Government Official Counts */}
        {role === "Government Official" &&
          counts &&
          "own_projects_by_stage" in counts && (
            <div className="flex flex-col gap-[10px]">
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Created Projects by Stage
              </span>
              {Object.keys(counts.own_projects_by_stage || {}).length === 0 ? (
                <p className="font-body-md text-[13px] text-on-surface-variant/70 italic">
                  No projects created yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-[8px] sm:grid-cols-3">
                  {Object.entries(counts.own_projects_by_stage).map(
                    ([stage, count]) => (
                      <div
                        key={stage}
                        className="flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-[10px]"
                      >
                        <span className="truncate font-data-mono text-[10px] text-on-surface-variant">
                          {stage}
                        </span>
                        <span className="font-display-md text-[18px] font-bold text-on-surface">
                          {count}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          )}

        {/* Administrator */}
        {role === "Administrator" && (
          <div className="flex items-center gap-[10px] rounded-xl border border-white/5 bg-white/[0.03] p-[14px]">
            <span
              className="material-symbols-outlined text-[20px] text-primary"
              aria-hidden="true"
            >
              security
            </span>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Full platform administration privileges. User and system controls
              available in the Admin Dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
