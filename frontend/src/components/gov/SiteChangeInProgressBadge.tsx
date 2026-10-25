import React from "react";

interface SiteChangeInProgressBadgeProps {
  status: string;
}

export function SiteChangeInProgressBadge({ status }: SiteChangeInProgressBadgeProps) {
  const displayStatus =
    status === "requested"
      ? "Requested"
      : status === "proposed"
      ? "Proposed"
      : status === "approved"
      ? "Approved"
      : status === "rejected"
      ? "Rejected"
      : status;

  return (
    <div
      id="site-change-in-progress-note"
      className="inline-flex items-center gap-[6px] rounded-full border border-warning/40 bg-warning/10 px-[10px] py-[3px] font-data-mono text-[11px] font-medium text-warning"
    >
      <span className="h-[6px] w-[6px] rounded-full bg-warning animate-pulse" />
      <span>Site change in progress ({displayStatus})</span>
    </div>
  );
}
