"use client";

import { useEffect, useState } from "react";
import { AdminAnalytics, getAdminAnalytics } from "@/services/admin";

export function AdminAnalyticsSection() {
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminAnalytics(days)
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load analytics");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [days]);

  function handleSelectDays(opt: 7 | 30 | 90) {
    if (opt === days) return;
    setLoading(true);
    setDays(opt);
  }

  return (
    <section id="admin-analytics-section" className="glass-card rounded-[20px] p-[24px] border border-white/10 mt-[24px]">
      {/* Header and 7 / 30 / 90 Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-[16px] pb-[16px] border-b border-white/10">
        <div>
          <span className="font-data-mono text-[11px] font-semibold tracking-wider text-primary uppercase">
            Platform Telemetry // Metrics
          </span>
          <h2 className="text-xl font-bold font-display-md text-foreground mt-[2px]">Activity & Trends</h2>
        </div>

        <div className="flex items-center gap-[6px] bg-surface-muted/60 p-[3px] rounded-[8px] border border-white/15">
          {([7, 30, 90] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              id={`analytics-range-${opt}-btn`}
              onClick={() => handleSelectDays(opt)}
              className={`px-[12px] py-[4px] rounded-[6px] text-[12px] font-data-mono font-medium transition-all cursor-pointer ${
                days === opt
                  ? "bg-primary text-slate-950 font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  : "text-on-surface-variant hover:text-foreground"
              }`}
            >
              {opt}d
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="py-[48px] text-center text-on-surface-variant font-data-mono text-[12px]">
          LOADING TELEMETRY DATA…
        </div>
      ) : error ? (
        <div className="py-[32px] text-center text-danger font-data-mono text-[12px]">
          {error}
        </div>
      ) : !data ? (
        <div className="py-[32px] text-center text-on-surface-variant font-data-mono text-[12px]">
          No data yet
        </div>
      ) : (
        <div className="mt-[20px] space-y-[24px]">
          {/* 1. Daily Trends Line Chart */}
          <div className="p-[16px] rounded-[14px] bg-surface-container-lowest/50 border border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-[8px] mb-[12px]">
              <span className="text-[13px] font-semibold text-foreground font-sans">
                Daily Activity Trends ({days} Days)
              </span>
              <div className="flex items-center gap-[12px] text-[11px] font-data-mono">
                <span className="flex items-center gap-[4px] text-cyan-400">
                  <span className="inline-block w-[10px] h-[3px] bg-cyan-400 rounded-sm" /> Logins
                </span>
                <span className="flex items-center gap-[4px] text-sky-400">
                  <span className="inline-block w-[10px] h-[3px] bg-sky-400 rounded-sm" /> Comments
                </span>
                <span className="flex items-center gap-[4px] text-blue-400">
                  <span className="inline-block w-[10px] h-[3px] bg-blue-400 rounded-sm" /> New Users
                </span>
              </div>
            </div>
            <DailyTrendsChart series={data.daily_series} />
          </div>

          {/* 2. Secondary Row: Projects per stage & Users by role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
            {/* Projects per Stage Bar Chart */}
            <div className="p-[16px] rounded-[14px] bg-surface-container-lowest/50 border border-white/5 flex flex-col justify-between">
              <span className="text-[13px] font-semibold text-foreground font-sans mb-[12px]">
                Projects per Stage (Deployed)
              </span>
              <ProjectsStageChart data={data.projects_by_stage} />
            </div>

            {/* Users by Role Donut / Bar Chart */}
            <div className="p-[16px] rounded-[14px] bg-surface-container-lowest/50 border border-white/5 flex flex-col justify-between">
              <span className="text-[13px] font-semibold text-foreground font-sans mb-[12px]">
                Users by Role
              </span>
              <UsersRoleChart data={data.users_by_role} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DailyTrendsChart({ series }: { series: { date: string; new_users: number; comments: number; logins: number }[] }) {
  if (!series || series.length === 0) {
    return <div className="h-[180px] flex items-center justify-center text-[12px] font-data-mono text-on-surface-variant">No data yet</div>;
  }

  const maxVal = Math.max(
    1,
    ...series.map((d) => Math.max(d.new_users, d.comments, d.logins))
  );

  const allZero = series.every((d) => d.new_users === 0 && d.comments === 0 && d.logins === 0);

  const width = 600;
  const height = 180;
  const padLeft = 32;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const pointsCount = series.length;
  const stepX = pointsCount > 1 ? chartW / (pointsCount - 1) : chartW;

  function toY(val: number) {
    return padTop + chartH - (val / maxVal) * chartH;
  }

  const loginPoints = series.map((d, i) => `${padLeft + i * stepX},${toY(d.logins)}`).join(" ");
  const commentPoints = series.map((d, i) => `${padLeft + i * stepX},${toY(d.comments)}`).join(" ");
  const userPoints = series.map((d, i) => `${padLeft + i * stepX},${toY(d.new_users)}`).join(" ");

  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];
  const xLabels = [
    { idx: 0, text: series[0]?.date.slice(5) || "" },
    { idx: Math.floor(pointsCount / 2), text: series[Math.floor(pointsCount / 2)]?.date.slice(5) || "" },
    { idx: pointsCount - 1, text: series[pointsCount - 1]?.date.slice(5) || "" },
  ];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        aria-label="Daily platform activity chart"
      >
        {/* Y-axis grid lines & labels */}
        {yTicks.map((yVal, i) => {
          const yPos = toY(yVal);
          return (
            <g key={i}>
              <line x1={padLeft} y1={yPos} x2={width - padRight} y2={yPos} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <text x={padLeft - 6} y={yPos + 4} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">
                {yVal}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
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

        {/* Series Paths */}
        {!allZero && (
          <>
            <polyline fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={loginPoints} />
            <polyline fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={commentPoints} />
            <polyline fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={userPoints} />

            {/* Circles for points */}
            {series.map((d, i) => (
              <g key={i}>
                <circle cx={padLeft + i * stepX} cy={toY(d.logins)} r="3" fill="#22d3ee" />
                <circle cx={padLeft + i * stepX} cy={toY(d.comments)} r="2.5" fill="#38bdf8" />
                <circle cx={padLeft + i * stepX} cy={toY(d.new_users)} r="2.5" fill="#60a5fa" />
              </g>
            ))}
          </>
        )}
      </svg>
      {allZero && (
        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-data-mono text-on-surface-variant/70">
          No data yet
        </div>
      )}
    </div>
  );
}

function ProjectsStageChart({ data }: { data: Record<string, number> }) {
  const stages = [
    { key: "OpenForResponse", label: "Open" },
    { key: "InProgress", label: "In Prog" },
    { key: "Completed", label: "Done" },
    { key: "Halted", label: "Halted" },
    { key: "Recalled", label: "Recalled" },
  ];

  const total = Object.values(data || {}).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <div className="h-[120px] flex items-center justify-center text-[12px] font-data-mono text-on-surface-variant">No data yet</div>;
  }

  const maxCount = Math.max(1, ...stages.map((s) => data[s.key] || 0));

  return (
    <div className="space-y-[8px] py-[4px]">
      {stages.map((s) => {
        const count = data[s.key] || 0;
        const pct = Math.round((count / maxCount) * 100);
        return (
          <div key={s.key} className="space-y-[2px]">
            <div className="flex justify-between text-[11px] font-data-mono">
              <span className="text-on-surface-variant">{s.label}</span>
              <span className="text-foreground font-semibold">{count}</span>
            </div>
            <div className="h-[8px] w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsersRoleChart({ data }: { data: Record<string, number> }) {
  const roles = [
    { role: "Citizen", color: "#22d3ee" },
    { role: "Urban Planner", color: "#38bdf8" },
    { role: "Government Official", color: "#0284c7" },
    { role: "Administrator", color: "#0369a1" },
  ];

  const total = Object.values(data || {}).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <div className="h-[120px] flex items-center justify-center text-[12px] font-data-mono text-on-surface-variant">No data yet</div>;
  }

  return (
    <div className="space-y-[8px] py-[4px]">
      {roles.map((r) => {
        const count = data[r.role] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={r.role} className="space-y-[2px]">
            <div className="flex justify-between text-[11px] font-data-mono">
              <span className="text-on-surface-variant">{r.role}</span>
              <span className="text-foreground font-semibold">{count} ({pct}%)</span>
            </div>
            <div className="h-[8px] w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: r.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
