"use client";

import React from "react";
import { PublicProject, formatIndianBudget } from "@/services/publicProjects";
import { StanceBar } from "./StanceBar";

type ProjectDetailsProps = {
  detail: PublicProject;
};

export function ProjectDetails({ detail }: ProjectDetailsProps) {
  return (
    <>
      {/* 3 Stats (Budget, Days Left, People) - compact inline row ~58px */}
      <div className="flex items-center gap-[12px] rounded-[10px] border border-white/10 bg-white/5 px-[14px] py-[8px] h-[58px]">
        {/* Budget gets only the width it needs */}
        <div className="shrink-0 pr-[12px] border-r border-white/10">
          <b className="block font-data-mono text-[17px] text-on-surface leading-tight">
            {formatIndianBudget(detail.budget)}
          </b>
          <span className="font-body-md text-[10px] text-on-surface-variant uppercase tracking-wider block">
            Estimated Budget
          </span>
        </div>
        <div className="flex-1 min-w-0 px-[8px] border-r border-white/10">
          <b className="block font-data-mono text-[17px] text-on-surface leading-tight">
            {detail.stage === "OpenForResponse" && detail.days_left != null
              ? detail.days_left
              : "–"}
          </b>
          <span className="font-body-md text-[10px] text-on-surface-variant uppercase tracking-wider truncate block">
            Days left to respond
          </span>
        </div>
        <div className="flex-1 min-w-0 pl-[4px]">
          <b className="block font-data-mono text-[17px] text-on-surface leading-tight">
            {detail.participants.toLocaleString("en-IN")}
          </b>
          <span className="font-body-md text-[10px] text-on-surface-variant uppercase tracking-wider truncate block">
            People participated
          </span>
        </div>
      </div>

      {/* What people think (Stance Bar & Breakdown) ~70px */}
      <div className="rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
        <h4 className="font-body-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[6px]">
          What people think
        </h4>
        <StanceBar
          support={detail.support_count}
          concern={detail.concern_count}
          neutral={detail.neutral_count}
          showLabels={true}
        />
      </div>

      {/* About this project */}
      <div className="rounded-[10px] border border-white/10 bg-white/5 p-[10px]">
        <h4 className="font-body-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[4px]">
          About this project
        </h4>
        <p className="font-body-md text-[14px] text-on-surface leading-relaxed">
          {detail.description ?? "No project description has been recorded."}
        </p>
      </div>

      {/* Location & Coordinates (flexible map block) */}
      <div
        id="project-location-map"
        className="rounded-[10px] border border-white/10 bg-white/5 p-[10px] flex flex-col flex-1 min-h-[140px] max-h-[280px]"
      >
        <div className="flex items-center justify-between gap-[8px]">
          <h4 className="font-body-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Location
          </h4>
          <div className="flex items-center gap-[6px]">
            <span className="inline-flex items-center justify-center h-[22px] rounded-full border border-primary-container/40 bg-primary-container/10 px-[8px] font-data-mono text-[10px] text-primary-container">
              Simple
            </span>
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label="Satellite view (Soon)"
              className="inline-flex items-center justify-center gap-[3px] h-[22px] rounded-full border border-white/15 bg-white/5 px-[8px] font-data-mono text-[10px] text-on-surface-variant/60 cursor-not-allowed"
            >
              <span>Satellite</span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/50">
                (Soon)
              </span>
            </button>
          </div>
        </div>
        <div className="mt-[6px] font-data-mono text-[12px] flex items-center justify-between text-on-surface-variant">
          <span>Coordinates:</span>
          <span className="text-primary-container font-medium">
            {detail.location_lat != null && detail.location_lng != null
              ? `Lat: ${detail.location_lat.toFixed(4)}° N, Lng: ${detail.location_lng.toFixed(4)}° E`
              : "Coordinates pending"}
          </span>
        </div>
        {detail.location_lat != null && detail.location_lng != null && (
          <div className="mt-[6px]">
            <a
              id="project-location-map-link"
              href={`https://www.openstreetmap.org/?mlat=${detail.location_lat}&mlon=${detail.location_lng}#map=17/${detail.location_lat}/${detail.location_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-data-mono text-[11px] text-cyan-400 underline hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              View on map
            </a>
          </div>
        )}
      </div>
    </>
  );
}
