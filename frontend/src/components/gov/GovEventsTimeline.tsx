"use client";

import { GovProject, GovProjectEvent } from "@/services/gov";

interface GovEventsTimelineProps {
  project: GovProject;
  events: GovProjectEvent[];
}

export function GovEventsTimeline({ project, events }: GovEventsTimelineProps) {
  return (
    <div className="space-y-[24px]">
      {/* Prominent rejection reason banner if project has one */}
      {project.proposal_rejection_reason && (
        <div id="gov-rejection-banner" className="rounded-[12px] border border-danger/40 bg-danger/10 p-[16px]">
          <div className="flex items-center gap-[8px] text-danger font-semibold font-data-mono text-[12px] uppercase">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>PROPOSAL REJECTION FEEDBACK</span>
          </div>
          <p className="mt-[6px] text-sm text-white">
            {project.proposal_rejection_reason}
          </p>
        </div>
      )}

      {/* Audit Timeline */}
      <section className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px]">
        <h3 className="font-sans text-[16px] font-semibold text-white tracking-wide flex items-center gap-[8px]">
          <span className="material-symbols-outlined text-primary text-[20px]">history</span>
          <span>Project Audit Trail</span>
        </h3>

        {events.length === 0 ? (
          <p className="mt-[16px] font-data-mono text-sm text-on-surface-variant">
            NO AUDIT EVENTS RECORDED YET.
          </p>
        ) : (
          <div className="mt-[16px] space-y-[12px] border-l border-white/15 pl-[16px]">
            {events.map((ev) => (
              <div key={ev.id} className="relative group">
                <div className="absolute -left-[21px] top-[4px] h-[9px] w-[9px] rounded-full border border-primary bg-primary-container" />
                <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
                  <span className="font-data-mono text-[12px] font-semibold text-primary">
                    {ev.from_stage ? `${ev.from_stage} → ${ev.to_stage}` : ev.to_stage}
                  </span>
                  <span className="font-data-mono text-[11px] text-on-surface-variant">
                    {new Date(ev.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
                {ev.note && (
                  <p className="mt-[2px] text-sm text-on-surface-variant">
                    {ev.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
