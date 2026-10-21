"use client";

import React from "react";
import { AdminPlannerVerificationSection } from "./AdminPlannerVerificationSection";

export function AdminVerificationTabSection() {
  return (
    <div>
      <div className="mb-[20px]">
        <p className="font-data-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
          ADMINISTRATION // VERIFICATION
        </p>
        <h1
          id="admin-section-heading"
          className="mt-[6px] font-display-md text-2xl font-bold text-on-surface"
        >
          Planner verification
        </h1>
        <p className="mt-[4px] text-sm text-on-surface-variant">
          Review planner credentials, government licenses, and verification submissions.
        </p>
      </div>
      <AdminPlannerVerificationSection />
    </div>
  );
}
