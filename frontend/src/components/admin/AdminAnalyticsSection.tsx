"use client";

import { useEffect, useState } from "react";
import { AdminAnalytics, getAdminAnalytics } from "@/services/admin";
import { SingleTrendChart } from "./AdminAnalyticsCharts";
import { AdminLeaderboardSection } from "./AdminLeaderboardSection";

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
    return () => { active = false; };
  }, [days]);

  function handleSelectDays(opt: 7 | 30 | 90) {
    if (opt === days) return;
    setLoading(true);
    setDays(opt);
  }

  return (
    <section id="admin-analytics-section" className="glass-card rounded-[20px] p-[24px] border border-white/10 mt-[24px]">
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
        <div className="py-[48px] text-center text-on-surface-variant font-data-mono text-[12px]">LOADING TELEMETRY DATA…</div>
      ) : error ? (
        <div className="py-[32px] text-center text-danger font-data-mono text-[12px]">{error}</div>
      ) : !data ? (
        <div className="py-[32px] text-center text-on-surface-variant font-data-mono text-[12px]">No data yet</div>
      ) : (
        <div className="mt-[20px] space-y-[24px]">
          {/* Two-column Daily Activity Trends: Logins (Green) and Comments (Red) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
            <div className="p-[16px] rounded-[14px] bg-surface-container-lowest/50 border border-white/5 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-[8px] mb-[12px]">
                <span className="text-[13px] font-semibold text-foreground font-sans">
                  Daily Logins ({days} Days)
                </span>
                <div className="flex items-center gap-[6px] text-[11px] font-data-mono text-emerald-400">
                  <span className="inline-block w-[10px] h-[3px] bg-emerald-400 rounded-sm" /> Logins
                </div>
              </div>
              <SingleTrendChart
                series={data.daily_series}
                dataKey="logins"
                color="#10b981"
                label="Daily logins"
              />
            </div>

            <div className="p-[16px] rounded-[14px] bg-surface-container-lowest/50 border border-white/5 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-[8px] mb-[12px]">
                <span className="text-[13px] font-semibold text-foreground font-sans">
                  Daily Comments ({days} Days)
                </span>
                <div className="flex items-center gap-[6px] text-[11px] font-data-mono text-rose-400">
                  <span className="inline-block w-[10px] h-[3px] bg-rose-400 rounded-sm" /> Comments
                </div>
              </div>
              <SingleTrendChart
                series={data.daily_series}
                dataKey="comments"
                color="#f43f5e"
                label="Daily comments"
              />
            </div>
          </div>

          {/* Top 10 Leaderboard Graphs: Officials, Planners, Commenters */}
          <AdminLeaderboardSection
            topOfficials={data.top_officials_by_projects}
            topPlanners={data.top_planners_by_projects}
            topCommenters={data.top_users_by_comments}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
            <div className="p-[16px] rounded-[14px] bg-surface-container-lowest/50 border border-white/5 flex flex-col justify-between">
              <span className="text-[13px] font-semibold text-foreground font-sans mb-[12px]">Projects per Stage (Deployed)</span>
              <ProjectsStageChart data={data.projects_by_stage} />
            </div>
            <div className="p-[16px] rounded-[14px] bg-surface-container-lowest/50 border border-white/5 flex flex-col justify-between">
              <span className="text-[13px] font-semibold text-foreground font-sans mb-[12px]">Users by Role</span>
              <UsersRoleChart data={data.users_by_role} />
            </div>
          </div>
        </div>
      )}
    </section>
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
              <div className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
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
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: r.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
