"use client";

import React from "react";
import { AdminAnalyticsSection } from "./AdminAnalyticsSection";

export function AdminAnalyticsTabSection() {
  return (
    <div>
      <div className="mb-[20px]">
        <p className="font-data-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
          ADMINISTRATION // ANALYTICS
        </p>
        <h1
          id="admin-section-heading"
          className="mt-[6px] font-display-md text-2xl font-bold text-on-surface"
        >
          Analytics
        </h1>
        <p className="mt-[4px] text-sm text-on-surface-variant">
          Platform telemetry, activity trends, and timeline engagement metrics.
        </p>
      </div>
      <AdminAnalyticsSection />
    </div>
  );
}
