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
      className="project-card group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[16px] border border-white/10 bg-surface-container-lowest/90 p-[16px] text-left backdrop-blur-[20px] transition-all duration-300 hover:border-primary-container/60 hover:shadow-[0_0_26px_-8px_rgba(34,211,238,0.5)] hover:scale-[1.02] focus-visible:border-primary-container focus-visible:outline-none focus-visible:scale-[1.02] cursor-pointer select-none"
    >
      {/* Top badges: category chip & demo tag */}
      <div className="absolute top-[12px] left-[14px] z-10 flex items-center gap-[6px]">
        {project.category && (
          <span className="rounded-full border border-white/10 bg-surface-container-lowest/70 px-[10px] py-[3px] font-body-md text-[11px] text-on-surface-variant">
            {project.category}
          </span>
        )}
        {project.is_demo && (
          <span className="rounded-full border border-primary-container/30 bg-primary-container/15 px-[8px] py-[2px] font-data-mono text-[10px] font-semibold tracking-wider text-primary-container uppercase">
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
        <span className="pointer-events-none">{isFollowed ? "Following" : "Follow"}</span>
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
