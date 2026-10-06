"use client";

import React from "react";

type StanceBarProps = {
  support: number;
  concern: number;
  neutral: number;
  showLabels?: boolean;
};

export function StanceBar({
  support,
  concern,
  neutral,
  showLabels = false,
}: StanceBarProps) {
  const total = support + concern + neutral;
  if (total === 0) {
    return null;
  }

  const supportPct = (support / total) * 100;
  const concernPct = (concern / total) * 100;
  const neutralPct = (neutral / total) * 100;

  return (
    <div className="w-full">
      <div
        className="flex h-[6px] w-full overflow-hidden rounded-[6px] gap-[2px] my-[4px]"
        role="img"
        aria-label={`Support ${support}, concern ${concern}, neutral ${neutral} people`}
      >
        {support > 0 && (
          <span
            className="block h-full bg-success rounded-l-[4px] min-w-[3px]"
            style={{ width: `${supportPct}%` }}
          />
        )}
        {concern > 0 && (
          <span
            className="block h-full bg-danger min-w-[3px]"
            style={{ width: `${concernPct}%` }}
          />
        )}
        {neutral > 0 && (
          <span
            className="block h-full bg-muted-foreground rounded-r-[4px] min-w-[3px]"
            style={{ width: `${neutralPct}%` }}
          />
        )}
      </div>

      {showLabels && (
        <div className="mt-[6px] flex flex-wrap gap-[16px] font-data-mono text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-[6px]">
            <span className="h-[6px] w-[6px] rounded-full bg-success" />
            Support {support} ({Math.round(supportPct)}%)
          </span>
          <span className="flex items-center gap-[6px]">
            <span className="h-[6px] w-[6px] rounded-full bg-danger" />
            Concern {concern} ({Math.round(concernPct)}%)
          </span>
          <span className="flex items-center gap-[6px]">
            <span className="h-[6px] w-[6px] rounded-full bg-muted-foreground" />
            Neutral {neutral} ({Math.round(neutralPct)}%)
          </span>
        </div>
      )}
    </div>
  );
}
