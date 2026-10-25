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

      {/* Location & Coordinates (row with square map link button) */}
      <div
        id="project-location-map"
        className="relative flex items-stretch justify-between rounded-[10px] border border-white/10 bg-white/5 overflow-hidden"
      >
        <div
          className={`flex-1 min-w-0 p-[10px] flex flex-col justify-center ${
            detail.location_lat != null && detail.location_lng != null ? "pr-[84px]" : ""
          }`}
        >
          <h4 className="font-body-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Location
          </h4>
          <div className="mt-[4px] font-data-mono text-[12px] text-on-surface-variant flex flex-wrap items-baseline gap-x-[6px]">
            <span>Coordinates:</span>
            <span className="text-primary-container font-medium">
              {detail.location_lat != null && detail.location_lng != null
                ? `Lat: ${detail.location_lat.toFixed(4)}° N, Lng: ${detail.location_lng.toFixed(4)}° E`
                : "Coordinates pending"}
            </span>
          </div>
        </div>
        {detail.location_lat != null && detail.location_lng != null && (
          <a
            id="project-location-map-link"
            href={`https://www.openstreetmap.org/?mlat=${detail.location_lat}&mlon=${detail.location_lng}#map=17/${detail.location_lat}/${detail.location_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on map (opens OpenStreetMap)"
            title="View on map"
            className="absolute top-[-1px] bottom-[-1px] right-[-1px] aspect-square flex items-center justify-center rounded-r-[10px] border-l border-white/10 bg-primary-container/10 hover:bg-primary-container/20 text-primary-container transition-colors focus:outline-none focus:ring-1 focus:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[20px] select-none">
              location_on
            </span>
          </a>
        )}
      </div>
    </>
  );
}
