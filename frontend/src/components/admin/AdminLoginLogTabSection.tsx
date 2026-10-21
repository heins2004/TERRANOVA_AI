"use client";

import React from "react";
import { AdminLoginLogSection } from "./AdminLoginLogSection";

export function AdminLoginLogTabSection() {
  return (
    <div>
      <div className="mb-[20px]">
        <p className="font-data-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
          ADMINISTRATION // AUDIT LOG
        </p>
        <h1
          id="admin-section-heading"
          className="mt-[6px] font-display-md text-2xl font-bold text-on-surface"
        >
          Login log
        </h1>
        <p className="mt-[4px] text-sm text-on-surface-variant">
          Authentication audit trails, IP logs, and system access history.
        </p>
      </div>
      <AdminLoginLogSection />
    </div>
  );
}
