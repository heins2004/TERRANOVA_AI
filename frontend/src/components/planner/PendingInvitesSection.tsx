"use client";

import { useState } from "react";
import Link from "next/link";
import { PlannerPendingInvite } from "@/services/planner";

interface PendingInvitesSectionProps {
  invites: PlannerPendingInvite[];
  loading: boolean;
  actionLoadingId: number | null;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
}

export function PendingInvitesSection({
  invites,
  loading,
  actionLoadingId,
  onAccept,
  onDecline,
}: PendingInvitesSectionProps) {
  const [nowTime] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));

  return (
    <section className="mt-[32px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
        <h2 className="font-display-md text-[20px] font-semibold uppercase tracking-wide text-foreground">
          Pending Invitations
        </h2>
        <span className="font-data-mono text-[11px] uppercase tracking-wider text-primary">
          {invites.length} PENDING
        </span>
      </div>

      {loading ? (
        <p className="mt-[16px] font-data-mono text-sm text-on-surface-variant">LOADING INVITATIONS...</p>
      ) : invites.length === 0 ? (
        <div className="mt-[16px] rounded-xl border border-white/10 bg-white/[0.02] p-[24px]">
          <p className="font-data-mono text-sm text-on-surface-variant">NO PENDING INVITATIONS.</p>
        </div>
      ) : (
        <div className="mt-[16px] grid gap-[16px] md:grid-cols-2">
          {invites.map((proj) => {
            const isDeadlinePassed = Boolean(
              proj.planner_deadline && nowTime > 0 && new Date(proj.planner_deadline).getTime() < nowTime
            );
            return (
              <div
                key={proj.project_id}
                className="glass-card rounded-xl border border-white/10 bg-white/[0.02] p-[20px] transition hover:border-primary-container/50"
              >
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <span className="font-data-mono text-[11px] uppercase text-primary">
                      PROJECT #{proj.project_id} • {proj.city || "ALL CITIES"}
                    </span>
                    <h3 className="mt-[4px] font-display-md text-[18px] font-medium text-foreground">
                      {proj.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded border px-[8px] py-[3px] font-data-mono text-[10px] uppercase ${
                      isDeadlinePassed
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : "border-primary-container/40 bg-primary-container/10 text-primary"
                    }`}
                  >
                    {isDeadlinePassed ? "EXPIRED" : "INVITED"}
                  </span>
                </div>

                <div className="mt-[16px] flex flex-wrap gap-[16px] font-data-mono text-[11px] text-on-surface-variant">
                  <div>
                    <span className="text-muted-foreground">OFFICIAL:</span>{" "}
                    <span className="text-foreground">
                      {proj.official_name ?? "Government Official"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DEADLINE:</span>{" "}
                    <span className="text-foreground">
                      {proj.planner_deadline
                        ? new Date(proj.planner_deadline).toLocaleString("en-IN")
                        : "NO DEADLINE"}
                    </span>
                  </div>
                </div>

                <div className="mt-[20px] flex items-center justify-end gap-[10px]">
                  <button
                    type="button"
                    id={`planner-decline-invite-${proj.project_id}`}
                    onClick={() => onDecline(proj.project_id)}
                    disabled={actionLoadingId === proj.project_id}
                    className="rounded border border-danger/60 px-[14px] py-[8px] font-data-mono text-[11px] font-semibold uppercase tracking-wider text-danger hover:bg-danger/10 disabled:opacity-50"
                  >
                    {actionLoadingId === proj.project_id ? "DECLINING..." : "DECLINE"}
                  </button>
                  <button
                    type="button"
                    id={`planner-accept-invite-${proj.project_id}`}
                    onClick={() => onAccept(proj.project_id)}
                    disabled={actionLoadingId === proj.project_id || isDeadlinePassed}
                    title={isDeadlinePassed ? "Invitation deadline has passed" : undefined}
                    className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[11px] font-semibold uppercase tracking-wider text-primary hover:bg-primary-container/30 disabled:opacity-50"
                  >
                    {actionLoadingId === proj.project_id ? "ACCEPTING..." : "ACCEPT"}
                  </button>
                <Link
                  href={`/planner/${proj.project_id}`}
                  className="rounded border border-white/20 px-[14px] py-[8px] font-data-mono text-[11px] uppercase text-foreground hover:bg-white/5"
                >
                  DETAILS
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </section>
  );
}
