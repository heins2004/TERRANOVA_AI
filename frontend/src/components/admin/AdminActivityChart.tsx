"use client";

import React, { useState } from "react";
import { AnalyticsDaily } from "@/services/admin";

type AdminActivityChartProps = {
  series: AnalyticsDaily[];
  totalLogins: number;
  totalComments: number;
  trackingStatus?: string;
};

export function AdminActivityChart({
  series,
  totalLogins,
  totalComments,
  trackingStatus = "Active",
}: AdminActivityChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validSeries = series && series.length > 0 ? series : [];
  const maxLogins = Math.max(1, ...validSeries.map((d) => d.logins || 0));
  const maxComments = Math.max(1, ...validSeries.map((d) => d.comments || 0));

  return (
    <div className="space-y-[14px]">
      {/* Metric badges */}
      <div className="grid grid-cols-2 gap-[10px]">
        <div className="p-[10px] rounded-[10px] bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="font-data-mono text-[10px] text-cyan-400 uppercase tracking-wider block">
              Logins (7d)
            </span>
            <span className="font-display-md text-[20px] font-bold text-foreground">
              {totalLogins.toLocaleString()}
            </span>
          </div>
          <span className="material-symbols-outlined text-cyan-400 text-[20px]" aria-hidden="true">
            login
          </span>
        </div>

        <div className="p-[10px] rounded-[10px] bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="font-data-mono text-[10px] text-sky-400 uppercase tracking-wider block">
              Comments (7d)
            </span>
            <span className="font-display-md text-[20px] font-bold text-foreground">
              {totalComments.toLocaleString()}
            </span>
          </div>
          <span className="material-symbols-outlined text-sky-400 text-[20px]" aria-hidden="true">
            forum
          </span>
        </div>
      </div>

      {/* 7-day bar chart */}
      <div className="p-[12px] rounded-[12px] bg-surface-container-lowest/40 border border-white/5">
        <div className="flex items-center justify-between text-[11px] font-data-mono mb-[10px]">
          <span className="text-on-surface-variant">Daily Activity (Last 7 Days)</span>
          <div className="flex items-center gap-[10px]">
            <span className="flex items-center gap-[4px] text-cyan-400 text-[10px]">
              <span className="inline-block w-[8px] h-[8px] rounded-sm bg-cyan-400" /> Logins
            </span>
            <span className="flex items-center gap-[4px] text-sky-400 text-[10px]">
              <span className="inline-block w-[8px] h-[8px] rounded-sm bg-sky-400" /> Comments
            </span>
          </div>
        </div>

        {validSeries.length === 0 ? (
          <div className="h-[90px] flex items-center justify-center text-[11px] font-data-mono text-on-surface-variant">
            Loading activity telemetry...
          </div>
        ) : (
          <div className="h-[90px] flex items-end justify-between gap-[6px] pt-[8px] px-[4px]">
            {validSeries.map((d, idx) => {
              const loginHeight = Math.max(8, Math.round((d.logins / maxLogins) * 65));
              const commentHeight = Math.max(4, Math.round((d.comments / maxComments) * 65));
              const isHovered = hoveredIdx === idx;
              const dateLabel = d.date.slice(5);

              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-[4px] h-full justify-end cursor-pointer group"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-[28px] px-[8px] py-[3px] rounded bg-slate-900 border border-cyan-400/40 text-[10px] font-data-mono text-cyan-300 shadow-lg whitespace-nowrap z-20 pointer-events-none">
                      {d.date}: {d.logins} logins, {d.comments} comments
                    </div>
                  )}

                  {/* Dual bars */}
                  <div className="w-full flex items-end justify-center gap-[2px]">
                    <div
                      className="w-[7px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${loginHeight}px` }}
                    />
                    <div
                      className="w-[7px] bg-gradient-to-t from-sky-600 to-sky-400 rounded-t transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${commentHeight}px` }}
                    />
                  </div>

                  {/* Day label */}
                  <span className="text-[9px] font-data-mono text-on-surface-variant/70 group-hover:text-cyan-300 transition-colors">
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between text-[10px] font-data-mono text-on-surface-variant pt-[2px]">
        <span className="flex items-center gap-[5px]">
          <span className="inline-block w-[6px] h-[6px] rounded-full bg-success animate-pulse" />
          Status: {trackingStatus}
        </span>
        <span>Telemetry online</span>
      </div>
    </div>
  );
}
