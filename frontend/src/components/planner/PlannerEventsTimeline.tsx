"use client";

import { useEffect, useState } from "react";
import { getProjectEvents, ProjectEvent } from "@/services/planner";

interface PlannerEventsTimelineProps {
  projectId: number;
  refreshTrigger?: number;
}

export function PlannerEventsTimeline({
  projectId,
  refreshTrigger = 0,
}: PlannerEventsTimelineProps) {
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProjectEvents(projectId)
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load events."))
      .finally(() => setLoading(false));
  }, [projectId, refreshTrigger]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-[20px]">
        <p className="font-data-mono text-xs text-on-surface-variant">LOADING TIMELINE EVENTS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-[20px]">
        <p className="font-data-mono text-xs text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-[20px]">
      <h3 className="font-display-md text-[18px] font-semibold uppercase tracking-wider text-foreground">
        Project Events Timeline
      </h3>

      {events.length === 0 ? (
        <p className="mt-[16px] font-data-mono text-xs text-on-surface-variant">
          NO EVENTS RECORDED YET.
        </p>
      ) : (
        <div className="mt-[20px] space-y-[16px] border-l border-white/15 pl-[16px] ml-[8px]">
          {events.map((event) => (
            <div key={event.id} className="relative">
              <span className="absolute -left-[21px] top-[4px] h-[9px] w-[9px] rounded-full border border-primary-container bg-[#0a0e17]" />
              <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
                <div className="font-data-mono text-[12px] font-semibold text-primary">
                  {event.from_stage} &rarr; {event.to_stage}
                </div>
                <time className="font-data-mono text-[10px] text-on-surface-variant">
                  {new Date(event.created_at).toLocaleString("en-IN")}
                </time>
              </div>
              {event.note && (
                <p className="mt-[4px] text-xs text-on-surface-variant/90 leading-relaxed">
                  {event.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
