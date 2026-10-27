"use client";

import React, { useState } from "react";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type AdminDonutPieProps = {
  slices: DonutSlice[];
  centerValue?: string | number;
  centerLabel?: string;
  size?: number;
  donutWidth?: number;
  hoveredKey?: string | null;
  onHover?: (key: string | null) => void;
};

export function AdminDonutPie({
  slices,
  centerValue,
  centerLabel,
  size = 140,
  donutWidth = 18,
  hoveredKey,
  onHover,
}: AdminDonutPieProps) {
  const [internalHover, setInternalHover] = useState<string | null>(null);
  const activeHover = hoveredKey !== undefined ? hoveredKey : internalHover;

  const total = slices.reduce((acc, s) => acc + (s.value || 0), 0);
  const radius = (size - donutWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;

  let accumulatedPct = 0;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label="Donut distribution chart"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={donutWidth}
        />

        {/* Slices */}
        {total > 0 &&
          slices.map((slice) => {
            const val = slice.value || 0;
            if (val <= 0) return null;
            const pct = val / total;
            const strokeDash = pct * circ;
            const strokeOffset = -accumulatedPct * circ;
            accumulatedPct += pct;

            const isHovered = activeHover === slice.key;
            const isDimmed = activeHover !== null && !isHovered;

            return (
              <circle
                key={slice.key}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? donutWidth + 4 : donutWidth}
                strokeDasharray={`${strokeDash} ${circ - strokeDash}`}
                strokeDashoffset={strokeOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                style={{
                  opacity: isDimmed ? 0.35 : 1,
                  filter: isHovered ? `drop-shadow(0 0 6px ${slice.color})` : "none",
                }}
                onMouseEnter={() => {
                  setInternalHover(slice.key);
                  onHover?.(slice.key);
                }}
                onMouseLeave={() => {
                  setInternalHover(null);
                  onHover?.(null);
                }}
              />
            );
          })}
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
        {centerValue !== undefined && (
          <span className="font-display-md text-[20px] font-bold text-foreground leading-tight">
            {centerValue}
          </span>
        )}
        {centerLabel && (
          <span className="font-data-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-medium">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}
