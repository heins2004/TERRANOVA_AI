"use client";

import React from "react";
import { SampleProject } from "./sampleProjects";
import { StanceBar } from "./StanceBar";

type ProjectCardProps = {
  project: SampleProject;
  onSelect: (project: SampleProject, element: HTMLElement) => void;
  cardRef?: (node: HTMLElement | null) => void;
};

export function ProjectCard({ project, onSelect, cardRef }: ProjectCardProps) {
  const totalPeople =
    project.stance.support + project.stance.concern + project.stance.neutral;

  const stageLabel =
    project.stage === "Halted"
      ? "Halted"
      : project.stage === "Completed"
      ? "Completed"
      : project.stage === "InProgress"
      ? "In progress"
      : `${project.daysLeft} days left`;

  const stageColor =
    project.stage === "Halted"
      ? "text-danger"
      : project.stage === "Completed"
      ? "text-success"
      : project.stage === "InProgress"
      ? "text-primary-container"
      : "text-on-surface-variant";

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
      aria-label={`View ${project.name}, ${project.city}`}
      onClick={(e) => {
        onSelect(project, e.currentTarget);
      }}
      onKeyDown={handleKeyDown}
      className="project-card group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[16px] border border-white/10 bg-surface-container-lowest/80 p-[16px] text-left backdrop-blur-[20px] transition-all duration-300 hover:border-primary-container/60 hover:shadow-[0_0_26px_-8px_rgba(34,211,238,0.5)] hover:scale-[1.02] focus-visible:border-primary-container focus-visible:outline-none focus-visible:scale-[1.02] cursor-pointer select-none"
    >
      {/* Category radial gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: project.gradient }}
        aria-hidden="true"
      />
      {/* Surface shade vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/75 to-transparent"
        aria-hidden="true"
      />

      {/* Top category chip */}
      <span className="absolute top-[12px] left-[14px] z-10 rounded-full border border-white/10 bg-surface-container-lowest/70 px-[10px] py-[3px] font-body-md text-[11px] text-on-surface-variant">
        {project.category}
      </span>

      {/* Top-right disabled Follow button */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-label={`Follow ${project.name} (Soon)`}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-[10px] right-[12px] z-10 flex items-center gap-[4px] rounded-full border border-white/15 bg-white/5 px-[10px] py-[3px] font-body-md text-[11px] text-on-surface-variant/60 cursor-not-allowed"
      >
        <span>Follow</span>
        <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/50">
          (Soon)
        </span>
      </button>

      {/* Card Content */}
      <div className="relative z-10 mt-auto flex flex-col gap-[4px]">
        <h3 className="font-body-md text-[17px] font-bold text-on-surface leading-snug">
          {project.name}
        </h3>
        <p className="font-body-md text-[13px] text-on-surface-variant">
          {project.city} · ₹{project.budgetCrore.toLocaleString("en-IN")} Cr
        </p>

        {/* Display-only stance bar */}
        <StanceBar
          support={project.stance.support}
          concern={project.stance.concern}
          neutral={project.stance.neutral}
        />

        <div className="mt-[2px] flex items-center justify-between font-data-mono text-[12px] text-on-surface-variant">
          <span>{totalPeople.toLocaleString("en-IN")} people</span>
          <span className={stageColor}>{stageLabel}</span>
        </div>
      </div>
    </article>
  );
}
