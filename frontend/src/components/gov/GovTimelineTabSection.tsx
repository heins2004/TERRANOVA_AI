"use client";

import { GovProject, GovProjectEvent } from "@/services/gov";
import { GovEventsTimeline } from "./GovEventsTimeline";

interface GovTimelineTabSectionProps {
  project: GovProject;
  events: GovProjectEvent[];
}

export function GovTimelineTabSection({ project, events }: GovTimelineTabSectionProps) {
  return (
    <div className="space-y-[16px]">
      <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
        Timeline
      </h2>
      <GovEventsTimeline project={project} events={events} />
    </div>
  );
}
