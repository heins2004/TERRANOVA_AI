"use client";

import React from "react";
import { PublicProject, formatIndianBudget } from "@/services/publicProjects";
import { StanceBar } from "./StanceBar";

type ProjectDetailsProps = {
  detail: PublicProject;
  isFollowed?: boolean;
  isFollowInFlight?: boolean;
  onToggleFollow?: (projectId: number) => void;
};

export function ProjectDetails({
  detail,
  isFollowed = false,
  isFollowInFlight = false,
  onToggleFollow,
}: ProjectDetailsProps) {
  return (
    <>
      {/* 3 Stats (Budget, Days Left, People) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px] my-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
        <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-[12px] sm:pb-0 sm:pr-[16px]">
          <b className="block font-data-mono text-[22px] text-on-surface">
            {formatIndianBudget(detail.budget)}
          </b>
          <span className="font-body-md text-[12px] text-on-surface-variant">
            Estimated Budget
          </span>
        </div>
        <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-[12px] sm:pb-0 sm:pr-[16px]">
          <b className="block font-data-mono text-[22px] text-on-surface">
            {detail.stage === "OpenForResponse" && detail.days_left != null
              ? detail.days_left
              : "–"}
          </b>
          <span className="font-body-md text-[12px] text-on-surface-variant">
            Days left to respond
          </span>
        </div>
        <div>
          <b className="block font-data-mono text-[22px] text-on-surface">
            {detail.participants.toLocaleString("en-IN")}
          </b>
          <span className="font-body-md text-[12px] text-on-surface-variant">
            People participated
          </span>
        </div>
      </div>

      {/* What people think (Stance Bar & Breakdown) */}
      <div className="mb-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
        <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[10px]">
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
      <div className="mb-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
        <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[8px]">
          About this project
        </h4>
        <p className="font-body-md text-[14px] text-on-surface leading-relaxed">
          {detail.description ?? "No project description has been recorded."}
        </p>
        <div className="mt-[16px]">
          <button
            type="button"
            disabled={isFollowInFlight}
            aria-label={`Follow ${detail.title}`}
            aria-pressed={isFollowed}
            onClick={() => onToggleFollow?.(detail.id)}
            className={`inline-flex items-center gap-[6px] rounded-full border px-[18px] py-[8px] font-body-md text-[12px] transition-all ${
              isFollowed
                ? "border-primary-container/80 bg-primary-container/20 text-primary-container font-medium"
                : "border-white/15 bg-white/5 text-on-surface-variant hover:border-white/30 hover:text-on-surface"
            } ${isFollowInFlight ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span>{isFollowed ? "Following" : "Follow"}</span>
          </button>
        </div>
      </div>

      {/* Location & Coordinates */}
      <div className="mb-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[8px] mb-[10px]">
          <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Location
          </h4>
          <div className="flex items-center gap-[6px]">
            <span className="rounded-full border border-primary-container/40 bg-primary-container/10 px-[10px] py-[3px] font-data-mono text-[11px] text-primary-container">
              Simple
            </span>
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label="Satellite view (Soon)"
              className="flex items-center gap-[4px] rounded-full border border-white/15 bg-white/5 px-[10px] py-[3px] font-data-mono text-[11px] text-on-surface-variant/60 cursor-not-allowed"
            >
              <span>Satellite</span>
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/50">
                (Soon)
              </span>
            </button>
          </div>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-surface-container-lowest/80 p-[14px] font-data-mono text-[13px] text-on-surface flex items-center justify-between">
          <span>Coordinates:</span>
          <span className="text-primary-container font-medium">
            {detail.location_lat != null && detail.location_lng != null
              ? `Lat: ${detail.location_lat.toFixed(4)}° N, Lng: ${detail.location_lng.toFixed(4)}° E`
              : "Coordinates pending"}
          </span>
        </div>
      </div>
    </>
  );
}
