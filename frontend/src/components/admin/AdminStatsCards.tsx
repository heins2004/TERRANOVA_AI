"use client";

import { AdminStats } from "@/services/admin";

type AdminStatsCardsProps = {
  stats: AdminStats | null;
  loading: boolean;
};

export function AdminStatsCards({ stats, loading }: AdminStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-card rounded-[16px] p-[20px] border border-white/10 animate-pulse flex flex-col justify-between min-h-[140px]"
          >
            <div className="h-[12px] w-[90px] bg-white/10 rounded" />
            <div className="h-[28px] w-[60px] bg-primary/20 rounded mt-[12px]" />
            <div className="h-[12px] w-[120px] bg-white/5 rounded mt-[12px]" />
          </div>
        ))}
      </div>
    );
  }

  const totalUsers = (stats.active_vs_inactive.active || 0) + (stats.active_vs_inactive.inactive || 0);
  const deployedStages = stats.deployed_projects_by_stage || {};
  const totalDeployed = Object.values(deployedStages).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
      {/* 1. Users by Role */}
      <div className="glass-card rounded-[16px] p-[20px] border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
            Users By Role
          </span>
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            group
          </span>
        </div>
        <div className="mt-[12px]">
          <div className="font-display-md text-[28px] font-bold text-foreground leading-none">
            {totalUsers}
          </div>
          <p className="mt-[4px] text-[12px] text-on-surface-variant">Total registered non-demo accounts</p>
        </div>
        <div className="mt-[16px] pt-[12px] border-t border-white/5 grid grid-cols-2 gap-x-[8px] gap-y-[4px] text-[11px] font-data-mono">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Citizen:</span>
            <span className="text-primary font-semibold">{stats.users_by_role["Citizen"] ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Planner:</span>
            <span className="text-primary font-semibold">{stats.users_by_role["Urban Planner"] ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Official:</span>
            <span className="text-primary font-semibold">{stats.users_by_role["Government Official"] ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Admin:</span>
            <span className="text-primary font-semibold">{stats.users_by_role["Administrator"] ?? 0}</span>
          </div>
        </div>
      </div>

      {/* 2. Active vs Inactive */}
      <div className="glass-card rounded-[16px] p-[20px] border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
            Account Status
          </span>
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            verified_user
          </span>
        </div>
        <div className="mt-[12px]">
          <div className="font-display-md text-[28px] font-bold text-success leading-none">
            {stats.active_vs_inactive.active ?? 0}
          </div>
          <p className="mt-[4px] text-[12px] text-on-surface-variant">Active accounts in system</p>
        </div>
        <div className="mt-[16px] pt-[12px] border-t border-white/5 flex items-center justify-between text-[11px] font-data-mono">
          <div className="flex items-center gap-[6px]">
            <span className="inline-block w-[8px] h-[8px] rounded-full bg-success" />
            <span className="text-on-surface-variant">Active: {stats.active_vs_inactive.active ?? 0}</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <span className="inline-block w-[8px] h-[8px] rounded-full bg-danger" />
            <span className="text-danger">Inactive: {stats.active_vs_inactive.inactive ?? 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Deployed Projects */}
      <div className="glass-card rounded-[16px] p-[20px] border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
            Deployed Projects
          </span>
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            rocket_launch
          </span>
        </div>
        <div className="mt-[12px]">
          <div className="font-display-md text-[28px] font-bold text-foreground leading-none">
            {totalDeployed}
          </div>
          <p className="mt-[4px] text-[12px] text-on-surface-variant">Public deployed stages aggregate</p>
        </div>
        <div className="mt-[16px] pt-[12px] border-t border-white/5 flex flex-wrap gap-[6px] text-[10px] font-data-mono">
          <span className="px-[6px] py-[2px] rounded bg-white/5 border border-white/10 text-on-surface-variant">
            Response: {deployedStages["OpenForResponse"] ?? 0}
          </span>
          <span className="px-[6px] py-[2px] rounded bg-white/5 border border-white/10 text-on-surface-variant">
            In Prog: {deployedStages["InProgress"] ?? 0}
          </span>
          <span className="px-[6px] py-[2px] rounded bg-white/5 border border-white/10 text-on-surface-variant">
            Done: {deployedStages["Completed"] ?? 0}
          </span>
          <span className="px-[6px] py-[2px] rounded bg-white/5 border border-white/10 text-on-surface-variant">
            Halted: {deployedStages["Halted"] ?? 0}
          </span>
        </div>
      </div>

      {/* 4. Comments & Audit */}
      <div className="glass-card rounded-[16px] p-[20px] border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
            Activity & Logins
          </span>
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            forum
          </span>
        </div>
        <div className="mt-[12px]">
          <div className="font-display-md text-[28px] font-bold text-primary leading-none">
            {stats.comments_last_7_days}
          </div>
          <p className="mt-[4px] text-[12px] text-on-surface-variant">Comments in last 7 days</p>
        </div>
        <div className="mt-[16px] pt-[12px] border-t border-white/5 text-[11px] font-data-mono text-on-surface-variant flex items-center justify-between">
          <span>Logins (7d):</span>
          <span className="text-primary font-semibold">{stats.logins_last_7_days ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
