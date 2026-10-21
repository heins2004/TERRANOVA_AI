"use client";

import React from "react";
import { AdminStats } from "@/services/admin";
import { AdminStatsCards } from "./AdminStatsCards";

type AdminOverviewSectionProps = {
  stats: AdminStats | null;
  loading: boolean;
};

export function AdminOverviewSection({
  stats,
  loading,
}: AdminOverviewSectionProps) {
  return (
    <div>
      <div className="mb-[20px]">
        <p className="font-data-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
          ADMINISTRATION // OVERVIEW
        </p>
        <h1
          id="admin-section-heading"
          className="mt-[6px] font-display-md text-2xl font-bold text-on-surface"
        >
          Overview
        </h1>
        <p className="mt-[4px] text-sm text-on-surface-variant">
          Platform aggregates, user distributions, and project pipeline status.
        </p>
      </div>
      <AdminStatsCards stats={stats} loading={loading} />
    </div>
  );
}
