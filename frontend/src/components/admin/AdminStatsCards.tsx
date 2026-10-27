"use client";

import { useEffect, useState } from "react";
import { AdminStats, AdminAnalytics, getAdminAnalytics } from "@/services/admin";
import { AdminDonutPie, DonutSlice } from "./AdminDonutPie";
import { AdminActivityChart } from "./AdminActivityChart";
import { RoleDistributionCard, AccountStatusCard } from "./AdminOverviewCards";

type AdminStatsCardsProps = {
  stats: AdminStats | null;
  loading: boolean;
};

export function AdminStatsCards({ stats, loading }: AdminStatsCardsProps) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminAnalytics(7)
      .then((res) => {
        if (active) setAnalytics(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-card rounded-[18px] p-[24px] border border-white/10 animate-pulse flex flex-col justify-between min-h-[220px]"
          >
            <div className="h-[14px] w-[140px] bg-white/10 rounded" />
            <div className="h-[100px] w-full bg-white/5 rounded-[12px] my-[16px]" />
            <div className="h-[12px] w-[200px] bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Deployed Projects Data
  const stages = [
    { key: "OpenForResponse", label: "Open for Response", color: "#22d3ee" },
    { key: "InProgress", label: "In Progress", color: "#fbbf24" },
    { key: "Completed", label: "Completed", color: "#10b981" },
    { key: "Halted", label: "Halted", color: "#ef4444" },
  ];
  const deployedStages = stats.deployed_projects_by_stage || {};
  const stageSlices: DonutSlice[] = stages.map((s) => ({
    key: s.key,
    label: s.label,
    value: deployedStages[s.key] || 0,
    color: s.color,
  }));
  const totalDeployed = stageSlices.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
      {/* 1. Users by Role (Pie/Donut Chart) */}
      <RoleDistributionCard usersByRole={stats.users_by_role} />

      {/* 2. Account Status (Pie/Donut Chart) */}
      <AccountStatusCard
        activeCount={stats.active_vs_inactive.active || 0}
        inactiveCount={stats.active_vs_inactive.inactive || 0}
      />

      {/* 3. Deployed Projects (Stage Chart & Progress Bars) */}
      <div className="glass-card rounded-[18px] p-[22px] border border-white/10 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-[12px] border-b border-white/10">
            <div>
              <span className="font-data-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
                PIPELINE // PUBLIC PROJECTS
              </span>
              <h2 className="text-lg font-bold font-display-md text-foreground mt-[2px]">Deployed Projects</h2>
            </div>
            <span className="material-symbols-outlined text-[20px] text-cyan-400" aria-hidden="true">
              rocket_launch
            </span>
          </div>

          <div className="mt-[18px] flex flex-col sm:flex-row items-center gap-[20px]">
            <AdminDonutPie
              slices={stageSlices}
              centerValue={totalDeployed}
              centerLabel="DEPLOYED"
              size={135}
              donutWidth={18}
              hoveredKey={hoveredStage}
              onHover={setHoveredStage}
            />

            <div className="flex-1 w-full space-y-[8px]">
              {stages.map((st) => {
                const count = deployedStages[st.key] || 0;
                const pct = totalDeployed > 0 ? Math.round((count / totalDeployed) * 100) : 0;
                const isHovered = hoveredStage === st.key;
                return (
                  <div
                    key={st.key}
                    onMouseEnter={() => setHoveredStage(st.key)}
                    onMouseLeave={() => setHoveredStage(null)}
                    className={`space-y-[3px] p-[4px] px-[8px] rounded-[6px] transition-all cursor-pointer ${
                      isHovered ? "bg-white/10" : ""
                    }`}
                  >
                    <div className="flex justify-between text-[11px] font-data-mono">
                      <span className="text-on-surface-variant flex items-center gap-[6px]">
                        <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: st.color }} />
                        {st.label}
                      </span>
                      <span className="text-foreground font-semibold">
                        {count} <span className="text-on-surface-variant/70 text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-[5px] w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: st.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-[14px] pt-[12px] border-t border-white/5 flex items-center justify-between text-[11px] font-data-mono text-on-surface-variant">
          <span>Active public projects in pipeline</span>
          <span className="text-foreground font-semibold">{totalDeployed}</span>
        </div>
      </div>

      {/* 4. Activity & Logins (Activity Chart) */}
      <div className="glass-card rounded-[18px] p-[22px] border border-white/10 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-[12px] border-b border-white/10">
            <div>
              <span className="font-data-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
                TELEMETRY // ENGAGEMENT
              </span>
              <h2 className="text-lg font-bold font-display-md text-foreground mt-[2px]">Activity & Logins</h2>
            </div>
            <span className="material-symbols-outlined text-[20px] text-cyan-400" aria-hidden="true">
              monitoring
            </span>
          </div>

          <div className="mt-[16px]">
            <AdminActivityChart
              series={analytics?.daily_series || []}
              totalLogins={stats.logins_last_7_days ?? 0}
              totalComments={stats.comments_last_7_days ?? 0}
              trackingStatus={stats.logins_tracking_status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
