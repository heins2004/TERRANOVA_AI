"use client";

import React from "react";
import { LeaderboardItem } from "@/services/admin";

type AdminLeaderboardSectionProps = {
  topOfficials?: LeaderboardItem[];
  topPlanners?: LeaderboardItem[];
  topCommenters?: LeaderboardItem[];
};

export function AdminLeaderboardSection({
  topOfficials = [],
  topPlanners = [],
  topCommenters = [],
}: AdminLeaderboardSectionProps) {
  return (
    <div className="space-y-[16px]">
      <div className="flex items-center justify-between pb-[4px]">
        <div>
          <span className="font-data-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
            LEADERBOARDS // TOP CONTRIBUTORS
          </span>
          <h3 className="text-lg font-bold font-display-md text-foreground mt-[2px]">
            Platform Rankings (Top 10)
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        {/* 1. Officials with Most Projects */}
        <LeaderboardCard
          title="Government Officials"
          subtitle="Most created projects"
          unitLabel="projects"
          icon="account_balance"
          items={topOfficials}
          barColor="#818cf8"
          rankColor="#a5b4fc"
        />

        {/* 2. Planners with Most Projects */}
        <LeaderboardCard
          title="Urban Planners"
          subtitle="Most assigned projects"
          unitLabel="projects"
          icon="architecture"
          items={topPlanners}
          barColor="#38bdf8"
          rankColor="#7dd3fc"
        />

        {/* 3. Users with Most Comments */}
        <LeaderboardCard
          title="Most Active Commenters"
          subtitle="Most public comments"
          unitLabel="comments"
          icon="forum"
          items={topCommenters}
          barColor="#34d399"
          rankColor="#6ee7b7"
          showRole
        />
      </div>
    </div>
  );
}

function LeaderboardCard({
  title,
  subtitle,
  unitLabel,
  icon,
  items,
  barColor,
  rankColor,
  showRole = false,
}: {
  title: string;
  subtitle: string;
  unitLabel: string;
  icon: string;
  items: LeaderboardItem[];
  barColor: string;
  rankColor: string;
  showRole?: boolean;
}) {
  const maxVal = Math.max(1, ...items.map((it) => it.count));

  return (
    <div className="p-[16px] rounded-[16px] bg-surface-container-lowest/50 border border-white/5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-[10px] border-b border-white/10">
          <div>
            <span className="text-[13px] font-semibold text-foreground font-sans block">
              {title}
            </span>
            <span className="text-[10px] font-data-mono text-on-surface-variant">
              {subtitle}
            </span>
          </div>
          <span className="material-symbols-outlined text-[20px]" style={{ color: rankColor }} aria-hidden="true">
            {icon}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-[12px] font-data-mono text-on-surface-variant">
            No activity recorded yet
          </div>
        ) : (
          <div className="mt-[12px] space-y-[8px]">
            {items.map((it, idx) => {
              const pct = Math.round((it.count / maxVal) * 100);
              const isTop3 = idx < 3;

              return (
                <div key={it.id || idx} className="space-y-[3px]">
                  <div className="flex items-center justify-between text-[11px] font-data-mono">
                    <div className="flex items-center gap-[6px] truncate pr-2">
                      <span
                        className={`text-[10px] font-bold px-[5px] py-[1px] rounded ${
                          isTop3 ? "bg-white/15 text-foreground" : "text-on-surface-variant/70"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-foreground font-medium truncate" title={it.name}>
                        {it.name}
                      </span>
                      {showRole && it.role && (
                        <span className="text-[9px] px-[4px] py-[0.5px] rounded bg-white/5 text-on-surface-variant border border-white/10 shrink-0">
                          {it.role}
                        </span>
                      )}
                    </div>
                    <span className="text-foreground font-bold shrink-0">
                      {it.count}{" "}
                      <span className="text-[9px] text-on-surface-variant font-normal">
                        {unitLabel}
                      </span>
                    </span>
                  </div>

                  {/* Horizontal Bar Graph */}
                  <div className="h-[5px] w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-[14px] pt-[8px] border-t border-white/5 flex items-center justify-between text-[10px] font-data-mono text-on-surface-variant">
        <span>Rankings aggregate</span>
        <span>Top {items.length} listed</span>
      </div>
    </div>
  );
}
