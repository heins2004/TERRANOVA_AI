"use client";

import React from "react";
import { PublicProject, formatIndianBudget } from "@/services/publicProjects";
import { StanceBar } from "./StanceBar";

type ProjectCardProps = {
  project: PublicProject;
  isFollowed?: boolean;
  isFollowInFlight?: boolean;
  onSelect: (project: PublicProject, element: HTMLElement) => void;
  onToggleFollow?: (projectId: number) => void;
  cardRef?: (node: HTMLElement | null) => void;
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  Road: "radial-gradient(circle at 80% 20%, rgba(34,211,238,0.25) 0%, transparent 60%)",
  Hospital: "radial-gradient(circle at 80% 20%, rgba(52,211,153,0.25) 0%, transparent 60%)",
  School: "radial-gradient(circle at 80% 20%, rgba(251,191,36,0.25) 0%, transparent 60%)",
  Stadium: "radial-gradient(circle at 80% 20%, rgba(168,85,247,0.25) 0%, transparent 60%)",
  Mall: "radial-gradient(circle at 80% 20%, rgba(244,114,182,0.25) 0%, transparent 60%)",
  Park: "radial-gradient(circle at 80% 20%, rgba(74,222,128,0.25) 0%, transparent 60%)",
};

export function ProjectCard({
  project,
  isFollowed = false,
  isFollowInFlight = false,
  onSelect,
  onToggleFollow,
  cardRef,
}: ProjectCardProps) {
  const stageLabel =
    project.stage === "Halted"
      ? "Halted"
      : project.stage === "Completed"
      ? "Completed"
      : project.stage === "InProgress"
      ? "In progress"
      : project.days_left != null
      ? `${project.days_left} days left`
      : project.stage === "OpenForResponse"
      ? "Open for response"
      : project.stage;

  const stageColor =
    project.stage === "Halted"
      ? "text-danger"
      : project.stage === "Completed"
      ? "text-success"
      : project.stage === "InProgress"
      ? "text-primary-container"
      : "text-on-surface-variant";

  const cityName = project.city_name || project.city || "India";
  const gradient =
    (project.category && CATEGORY_GRADIENTS[project.category]) ||
    "radial-gradient(circle at 80% 20%, rgba(34,211,238,0.2) 0%, transparent 60%)";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(project, e.currentTarget);
    }
  };

  return (
    <article
      ref={cardRef}
      tabIndex={0}
      role="button"
      aria-label={`View ${project.title}, ${cityName}`}
      onClick={(e) => {
        onSelect(project, e.currentTarget);
      }}
      onKeyDown={handleKeyDown}
      className="project-card group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[16px] border border-white/10 bg-surface-container-lowest/80 p-[16px] text-left backdrop-blur-[20px] transition-all duration-300 hover:border-primary-container/60 hover:shadow-[0_0_26px_-8px_rgba(34,211,238,0.5)] hover:scale-[1.02] focus-visible:border-primary-container focus-visible:outline-none focus-visible:scale-[1.02] cursor-pointer select-none"
    >
      {/* Category radial gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: gradient }}
        aria-hidden="true"
      />
      {/* Surface shade vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/75 to-transparent"
        aria-hidden="true"
      />

      {/* Top badges: category chip & demo tag */}
      <div className="absolute top-[12px] left-[14px] z-10 flex items-center gap-[6px]">
        {project.category && (
          <span className="rounded-full border border-white/10 bg-surface-container-lowest/70 px-[10px] py-[3px] font-body-md text-[11px] text-on-surface-variant">
            {project.category}
          </span>
        )}
        {project.is_demo && (
          <span className="rounded-full border border-secondary/30 bg-secondary/15 px-[8px] py-[2px] font-data-mono text-[10px] font-semibold tracking-wider text-secondary uppercase">
            Demo
          </span>
        )}
      </div>

      {/* Top-right Follow button */}
      <button
        type="button"
        disabled={isFollowInFlight}
        aria-label={`Follow ${project.title}`}
        aria-pressed={isFollowed}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFollow?.(project.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        className={`absolute top-[10px] right-[12px] z-10 flex items-center gap-[4px] rounded-full border px-[10px] py-[3px] font-body-md text-[11px] transition-all ${
          isFollowed
            ? "border-primary-container/80 bg-primary-container/20 text-primary-container font-medium"
            : "border-white/15 bg-white/5 text-on-surface-variant hover:border-white/30 hover:text-on-surface"
        } ${isFollowInFlight ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span>{isFollowed ? "Following" : "Follow"}</span>
      </button>

      {/* Card Content */}
      <div className="relative z-10 mt-auto flex flex-col gap-[4px]">
        <h3 className="font-body-md text-[17px] font-bold text-on-surface leading-snug">
          {project.title}
        </h3>
        <p className="font-body-md text-[13px] text-on-surface-variant">
          {cityName} · {formatIndianBudget(project.budget)}
        </p>

        {/* Display-only stance bar */}
        <StanceBar
          support={project.support_count}
          concern={project.concern_count}
          neutral={project.neutral_count}
        />

        <div className="mt-[2px] flex items-center justify-between font-data-mono text-[12px] text-on-surface-variant">
          <span>{project.participants.toLocaleString("en-IN")} people took part</span>
          <span className={stageColor}>{stageLabel}</span>
        </div>
      </div>
    </article>
  );
}
