"use client";

import React, { useState } from "react";
import { AdminDonutPie, DonutSlice } from "./AdminDonutPie";

type RoleCardProps = {
  usersByRole: Record<string, number>;
};

export function RoleDistributionCard({ usersByRole }: RoleCardProps) {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const roleSlices: DonutSlice[] = [
    { key: "Citizen", label: "Citizen", value: usersByRole["Citizen"] ?? 0, color: "#22d3ee" },
    { key: "Planner", label: "Urban Planner", value: usersByRole["Urban Planner"] ?? 0, color: "#38bdf8" },
    { key: "Official", label: "Government Official", value: usersByRole["Government Official"] ?? 0, color: "#818cf8" },
    { key: "Admin", label: "Administrator", value: usersByRole["Administrator"] ?? 0, color: "#c084fc" },
  ];
  const totalUsers = roleSlices.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="glass-card rounded-[18px] p-[22px] border border-white/10 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-[12px] border-b border-white/10">
          <div>
            <span className="font-data-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
              DISTRIBUTION // DEMOGRAPHICS
            </span>
            <h2 className="text-lg font-bold font-display-md text-foreground mt-[2px]">Users by Role</h2>
          </div>
          <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
            pie_chart
          </span>
        </div>

        <div className="mt-[18px] flex flex-col sm:flex-row items-center gap-[20px]">
          <AdminDonutPie
            slices={roleSlices}
            centerValue={totalUsers}
            centerLabel="USERS"
            size={135}
            donutWidth={18}
            hoveredKey={hoveredRole}
            onHover={setHoveredRole}
          />

          <div className="flex-1 w-full space-y-[8px]">
            {roleSlices.map((r) => {
              const pct = totalUsers > 0 ? Math.round((r.value / totalUsers) * 100) : 0;
              const isHovered = hoveredRole === r.key;
              return (
                <div
                  key={r.key}
                  onMouseEnter={() => setHoveredRole(r.key)}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`flex items-center justify-between p-[6px] px-[10px] rounded-[8px] transition-all cursor-pointer ${
                    isHovered ? "bg-white/10 scale-[1.02]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-[8px]">
                    <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="font-data-mono text-[12px] text-on-surface-variant font-medium">
                      {r.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-[8px] font-data-mono text-[12px]">
                    <span className="text-foreground font-semibold">{r.value}</span>
                    <span className="text-[10px] px-[6px] py-[1px] rounded bg-white/5 text-on-surface-variant border border-white/10">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-[14px] pt-[12px] border-t border-white/5 flex items-center justify-between text-[11px] font-data-mono text-on-surface-variant">
        <span>Total registered accounts</span>
        <span className="text-foreground font-semibold">{totalUsers}</span>
      </div>
    </div>
  );
}

type AccountStatusCardProps = {
  activeCount: number;
  inactiveCount: number;
};

export function AccountStatusCard({ activeCount, inactiveCount }: AccountStatusCardProps) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const totalAccounts = activeCount + inactiveCount;
  const activePct = totalAccounts > 0 ? Math.round((activeCount / totalAccounts) * 100) : 0;
  const statusSlices: DonutSlice[] = [
    { key: "active", label: "Active", value: activeCount, color: "#10b981" },
    { key: "inactive", label: "Inactive", value: inactiveCount, color: "#f43f5e" },
  ];

  return (
    <div className="glass-card rounded-[18px] p-[22px] border border-white/10 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-[12px] border-b border-white/10">
          <div>
            <span className="font-data-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
              SECURITY // ACCOUNT INTEGRITY
            </span>
            <h2 className="text-lg font-bold font-display-md text-foreground mt-[2px]">Account Status</h2>
          </div>
          <span className="material-symbols-outlined text-[20px] text-emerald-400" aria-hidden="true">
            verified_user
          </span>
        </div>

        <div className="mt-[18px] flex flex-col sm:flex-row items-center gap-[20px]">
          <AdminDonutPie
            slices={statusSlices}
            centerValue={`${activePct}%`}
            centerLabel="ACTIVE"
            size={135}
            donutWidth={18}
            hoveredKey={hoveredStatus}
            onHover={setHoveredStatus}
          />

          <div className="flex-1 w-full space-y-[10px]">
            <div
              onMouseEnter={() => setHoveredStatus("active")}
              onMouseLeave={() => setHoveredStatus(null)}
              className={`p-[10px] rounded-[10px] border transition-all cursor-pointer ${
                hoveredStatus === "active" ? "bg-emerald-500/15 border-emerald-500/40" : "bg-white/[0.03] border-white/5"
              }`}
            >
              <div className="flex items-center justify-between font-data-mono text-[12px]">
                <span className="flex items-center gap-[6px] text-emerald-400 font-medium">
                  <span className="w-[8px] h-[8px] rounded-full bg-emerald-400" />
                  Active Accounts
                </span>
                <span className="text-foreground font-bold">{activeCount}</span>
              </div>
              <div className="mt-[6px] h-[4px] w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activePct}%` }} />
              </div>
            </div>

            <div
              onMouseEnter={() => setHoveredStatus("inactive")}
              onMouseLeave={() => setHoveredStatus(null)}
              className={`p-[10px] rounded-[10px] border transition-all cursor-pointer ${
                hoveredStatus === "inactive" ? "bg-rose-500/15 border-rose-500/40" : "bg-white/[0.03] border-white/5"
              }`}
            >
              <div className="flex items-center justify-between font-data-mono text-[12px]">
                <span className="flex items-center gap-[6px] text-rose-400 font-medium">
                  <span className="w-[8px] h-[8px] rounded-full bg-rose-400" />
                  Inactive Accounts
                </span>
                <span className="text-foreground font-bold">{inactiveCount}</span>
              </div>
              <div className="mt-[6px] h-[4px] w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${100 - activePct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[14px] pt-[12px] border-t border-white/5 flex items-center justify-between text-[11px] font-data-mono text-on-surface-variant">
        <span>Active system proportion</span>
        <span className="text-emerald-400 font-semibold">{activePct}% operational</span>
      </div>
    </div>
  );
}
