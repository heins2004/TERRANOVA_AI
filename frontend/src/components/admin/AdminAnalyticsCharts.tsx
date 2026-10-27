"use client";

import React, { useState } from "react";

type SingleTrendChartProps = {
  series: { date: string; comments: number; logins: number }[];
  dataKey: "logins" | "comments";
  color: string;
  label: string;
};

export function SingleTrendChart({
  series,
  dataKey,
  color,
  label,
}: SingleTrendChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!series || series.length === 0) {
    return (
      <div className="h-[170px] flex items-center justify-center text-[12px] font-data-mono text-on-surface-variant">
        No data yet
      </div>
    );
  }

  const values = series.map((d) => d[dataKey] || 0);
  const maxVal = Math.max(1, ...values);
  const allZero = values.every((v) => v === 0);
  const width = 500;
  const height = 170;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 24;
  const padBottom = 26;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const pointsCount = series.length;
  const stepX = pointsCount > 1 ? chartW / (pointsCount - 1) : chartW;

  function toY(val: number) {
    return padTop + chartH - (val / maxVal) * chartH;
  }

  const linePoints = series
    .map((d, i) => `${padLeft + i * stepX},${toY(d[dataKey] || 0)}`)
    .join(" ");

  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];
  const xLabels = [
    { idx: 0, text: series[0]?.date.slice(5) || "" },
    { idx: Math.floor(pointsCount / 2), text: series[Math.floor(pointsCount / 2)]?.date.slice(5) || "" },
    { idx: pointsCount - 1, text: series[pointsCount - 1]?.date.slice(5) || "" },
  ];

  const selectedItem = activeIdx !== null ? series[activeIdx] : null;

  return (
    <div className="relative w-full">
      {/* Click / Active Point Info Banner */}
      <div className="min-h-[22px] mb-[6px] flex items-center justify-between text-[11px] font-data-mono">
        {selectedItem ? (
          <div className="flex items-center gap-[6px] px-[8px] py-[2px] rounded bg-white/10 border border-white/15 animate-fadeIn">
            <span className="text-foreground font-semibold">{selectedItem.date}</span>
            <span className="text-on-surface-variant">•</span>
            <span style={{ color }} className="font-bold">
              {selectedItem[dataKey]} {label}
            </span>
            <button
              type="button"
              onClick={() => setActiveIdx(null)}
              className="ml-[4px] text-on-surface-variant hover:text-foreground cursor-pointer"
              title="Clear selection"
            >
              ×
            </button>
          </div>
        ) : (
          <span className="text-on-surface-variant/60 text-[10px]">
            Click on any dot to inspect date & count
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        aria-label={`${label} chart`}
      >
        {yTicks.map((yVal, i) => {
          const yPos = toY(yVal);
          return (
            <g key={i}>
              <line
                x1={padLeft}
                y1={yPos}
                x2={width - padRight}
                y2={yPos}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 6}
                y={yPos + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.5)"
                fontSize="9"
                fontFamily="monospace"
              >
                {yVal}
              </text>
            </g>
          );
        })}
        {xLabels.map((xl, i) => (
          <text
            key={i}
            x={padLeft + xl.idx * stepX}
            y={height - 6}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            fill="rgba(255,255,255,0.5)"
            fontSize="9"
            fontFamily="monospace"
          >
            {xl.text}
          </text>
        ))}
        {!allZero && (
          <>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={linePoints}
            />
            {series.map((d, i) => {
              const cx = padLeft + i * stepX;
              const cy = toY(d[dataKey] || 0);
              const isSelected = activeIdx === i;

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                >
                  {/* Invisible larger click target */}
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />

                  {/* Highlight ring if selected */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="7"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Core dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "5" : "3.5"}
                    fill={color}
                    stroke="rgba(15, 23, 42, 0.9)"
                    strokeWidth={isSelected ? "2" : "1.5"}
                    className="transition-all duration-200"
                  />

                  {/* Tooltip on SVG for the clicked/selected point */}
                  {isSelected && (
                    <g transform={`translate(${cx}, ${Math.max(16, cy - 14)})`}>
                      <rect
                        x="-42"
                        y="-16"
                        width="84"
                        height="16"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke={color}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-4"
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {d.date.slice(5)}: {d[dataKey]}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </>
        )}
      </svg>
      {allZero && (
        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-data-mono text-on-surface-variant/70">
          No activity recorded
        </div>
      )}
    </div>
  );
}
