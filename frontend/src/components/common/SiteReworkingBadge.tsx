import React from "react";

interface SiteReworkingBadgeProps {
  status: string;
  id?: string;
  className?: string;
}

export function SiteReworkingBadge({ status, id, className = "" }: SiteReworkingBadgeProps) {
  const normStatus = status.toLowerCase();
  return (
    <span
      id={id ?? `reworking-site-badge-${normStatus}`}
      className={`inline-flex items-center gap-[6px] rounded-full border border-warning/40 bg-warning/10 px-[8px] py-[2px] font-data-mono text-[10px] font-medium text-warning ${className}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-warning animate-pulse" />
      <span>Reworking site ({normStatus})</span>
    </span>
  );
}
