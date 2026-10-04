"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/layout/auth-provider";
import { ProjectCard } from "./ProjectCard";
import { ProjectPanel } from "./ProjectPanel";
import {
  INDIA_OUTLINE,
  ProjectCategory,
  SAMPLE_PROJECTS,
  SampleProject,
} from "./sampleProjects";

const CATEGORIES: ("All" | ProjectCategory)[] = [
  "All",
  "Road",
  "Hospital",
  "School",
  "Stadium",
  "Mall",
  "Park",
];

export function PublicHome() {
  const { user, logout, isAuthenticated } = useAuth();
  const searchInputId = useId();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | ProjectCategory
  >("All");
  const [selectedSort, setSelectedSort] = useState<"talk" | "new" | "soon">(
    "talk"
  );
  const [isPast, setIsPast] = useState(false);

  const [selectedProject, setSelectedProject] = useState<SampleProject | null>(
    null
  );
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // SVG points for India decorative map outline
  const indiaPolygonPoints = useMemo(() => {
    return INDIA_OUTLINE.map(([lng, lat]) =>
      [((lng - 68) * 13 + 20).toFixed(1), ((37.5 - lat) * 13 + 10).toFixed(1)].join(
        ","
      )
    ).join(" ");
  }, []);

  // Filtered & sorted projects
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matches = SAMPLE_PROJECTS.filter((p) => {
      // Past switch: Completed or Halted are Past; OpenForResponse or InProgress are Open now
      const isProjectPast = p.stage === "Completed" || p.stage === "Halted";
      if (isPast !== isProjectPast) return false;

      // Category filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (q) {
        const hay = `${p.name} ${p.city} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    // Sorting
    return matches.sort((a, b) => {
      const pplA = a.stance.support + a.stance.concern + a.stance.neutral;
      const pplB = b.stance.support + b.stance.concern + b.stance.neutral;

      if (selectedSort === "talk") {
        return pplB - pplA;
      }
      if (selectedSort === "new") {
        return b.id - a.id;
      }
      // "soon": closing soon (ascending daysLeft, putting 0 days at end)
      const daysA = a.daysLeft > 0 ? a.daysLeft : 999;
      const daysB = b.daysLeft > 0 ? b.daysLeft : 999;
      return daysA - daysB;
    });
  }, [searchQuery, selectedCategory, selectedSort, isPast]);

  // Overall metric counts
  const openCount = useMemo(
    () =>
      SAMPLE_PROJECTS.filter((p) => p.stage === "OpenForResponse").length,
    []
  );
  const cityCount = useMemo(
    () => new Set(SAMPLE_PROJECTS.map((p) => p.city)).size,
    []
  );
  const totalParticipation = useMemo(
    () =>
      SAMPLE_PROJECTS.reduce(
        (sum, p) =>
          sum + p.stance.support + p.stance.concern + p.stance.neutral,
        0
      ),
    []
  );

  // Card fly animation & open panel
  const handleSelectProject = (project: SampleProject, cardElem: HTMLElement) => {
    triggerElementRef.current = cardElem;
    setSelectedProject(project);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!prefersReducedMotion && gridContainerRef.current) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const cards = gridContainerRef.current.querySelectorAll<HTMLElement>(
        ".project-card, .map-card"
      );

      cards.forEach((c) => {
        if (c === cardElem) return;
        const b = c.getBoundingClientRect();
        const dx = (b.left + b.width / 2 - cx) * 0.9;
        const dy = (b.top + b.height / 2 - cy) * 0.9;
        c.style.transition = "transform 0.8s cubic-bezier(0.45, 0, 0.2, 1), opacity 0.6s ease";
        c.style.transform = `translate3d(${dx}px, ${dy}px, 800px) rotateY(${dx / 60}deg)`;
        c.style.opacity = "0";
        c.style.pointerEvents = "none";
      });
    }
  };

  const handleClosePanel = () => {
    setSelectedProject(null);

    // Release cards
    if (gridContainerRef.current) {
      const cards = gridContainerRef.current.querySelectorAll<HTMLElement>(
        ".project-card, .map-card"
      );
      cards.forEach((c) => {
        c.style.transform = "";
        c.style.opacity = "";
        c.style.pointerEvents = "";
      });
    }

    // Return focus to triggering card
    setTimeout(() => {
      triggerElementRef.current?.focus();
    }, 50);
  };

  return (
    <div className="relative min-h-screen w-full bg-surface-container-lowest text-on-surface overflow-x-hidden">
      {/* Main Header */}
      <header className="relative z-10 mx-auto flex max-w-[1596px] flex-wrap items-center justify-between gap-[14px] px-[16px] py-[18px] sm:px-[32px] lg:px-[48px]">
        {/* Brand Text (not a link) */}
        <div className="font-body-md text-[17px] sm:text-[18px] font-bold tracking-[0.04em] text-on-surface select-none">
          TERRANOVA AI
        </div>

        {/* Search Bar */}
        <label
          htmlFor={searchInputId}
          className="order-3 flex h-[46px] w-full flex-1 sm:order-2 sm:w-auto max-w-[640px] items-center gap-[10px] rounded-full border border-white/15 bg-white/5 px-[18px] shadow-sm backdrop-blur-[18px] transition-all focus-within:border-primary-container focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.25)]"
        >
          <span className="text-[16px] text-on-surface-variant select-none" aria-hidden="true">
            ⌕
          </span>
          <input
            id={searchInputId}
            type="search"
            maxLength={80}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.slice(0, 80))}
            placeholder="Search a city, area or project"
            aria-label="Search a city, area or project"
            className="w-full min-w-0 bg-transparent font-body-md text-[14px] text-on-surface placeholder:text-on-surface-variant focus:outline-none"
          />
        </label>

        {/* Action Controls & Authentication */}
        <div className="order-2 sm:order-3 flex items-center gap-[8px]">
          {/* Switched-off Theme Toggle */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Switch theme (Soon)"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/15 bg-white/5 text-[15px] text-on-surface-variant/60 cursor-not-allowed"
          >
            ◐
          </button>

          {/* User Auth Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-[8px]">
              {/* Switched-off Messages Bell */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Messages (Soon)"
                className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/15 bg-white/5 text-[15px] text-on-surface-variant/60 cursor-not-allowed"
              >
                <span>✉</span>
                <span className="absolute top-[8px] right-[8px] h-[7px] w-[7px] rounded-full bg-danger opacity-70" />
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="h-[42px] rounded-full border border-primary-container/60 bg-primary-container/10 px-[18px] font-body-md text-[13px] text-primary transition-colors hover:bg-primary-container/20 focus-visible:outline-none focus-visible:border-primary-container"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-[8px]">
              <Link
                href="/login"
                className="flex h-[42px] items-center rounded-full border border-primary-container/60 bg-primary-container/10 px-[18px] font-body-md text-[13px] text-primary transition-colors hover:bg-primary-container/20 focus-visible:outline-none focus-visible:border-primary-container"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex h-[42px] items-center rounded-full border border-white/15 bg-white/5 px-[18px] font-body-md text-[13px] text-on-surface-variant transition-colors hover:border-primary-container hover:text-on-surface focus-visible:outline-none"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-[1596px] px-[16px] pb-[48px] sm:px-[32px] lg:px-[48px]">
        {/* Title */}
        <h1 className="mt-[12px] font-body-md text-[26px] sm:text-[34px] font-light text-on-surface tracking-tight">
          Public projects across India
        </h1>

        {/* Global summary strip */}
        <div className="mt-[6px] mb-[18px] flex flex-wrap gap-x-[22px] gap-y-[6px] font-body-md text-[13px] text-on-surface-variant">
          <span>
            <b className="font-data-mono font-bold text-on-surface">
              {openCount}
            </b>{" "}
            open for response
          </span>
          <span>
            <b className="font-data-mono font-bold text-on-surface">
              {cityCount}
            </b>{" "}
            cities
          </span>
          <span>
            <b className="font-data-mono font-bold text-on-surface">
              {totalParticipation.toLocaleString("en-IN")}
            </b>{" "}
            people have taken part
          </span>
        </div>

        {/* Filter Toolbar: Category Chips, Sort, and Status Segments */}
        <div className="mb-[20px] flex flex-wrap items-center gap-[8px]">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-[6px]">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-[14px] py-[6px] font-body-md text-[13px] transition-all focus-visible:outline-none ${
                    isActive
                      ? "border-primary-container bg-primary-container/20 text-primary-container font-medium"
                      : "border-white/15 bg-white/5 text-on-surface-variant hover:border-white/30 hover:text-on-surface"
                  }`}
                >
                  {cat === "All" ? "All types" : cat}
                </button>
              );
            })}
          </div>

          {/* Sort Select */}
          <div className="flex items-center">
            <select
              id="so"
              value={selectedSort}
              onChange={(e) =>
                setSelectedSort(e.target.value as "talk" | "new" | "soon")
              }
              aria-label="Sort projects"
              className="rounded-full border border-white/15 bg-white/5 px-[14px] py-[7px] font-body-md text-[13px] text-on-surface focus-visible:outline-none focus-visible:border-primary-container"
            >
              <option value="talk" className="bg-surface-container-lowest text-on-surface">
                Most discussed
              </option>
              <option value="new" className="bg-surface-container-lowest text-on-surface">
                Newest
              </option>
              <option value="soon" className="bg-surface-container-lowest text-on-surface">
                Closing soon
              </option>
            </select>
          </div>

          {/* Segmented Switch: Open now vs Past projects */}
          <div className="ml-auto flex items-center gap-[4px] rounded-full border border-white/15 bg-white/5 p-[2px]">
            <button
              type="button"
              aria-pressed={!isPast}
              onClick={() => setIsPast(false)}
              className={`rounded-full px-[14px] py-[5px] font-body-md text-[13px] transition-all ${
                !isPast
                  ? "border border-primary-container/60 bg-primary-container/20 text-primary-container font-medium"
                  : "border border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Open now
            </button>
            <button
              type="button"
              aria-pressed={isPast}
              onClick={() => setIsPast(true)}
              className={`rounded-full px-[14px] py-[5px] font-body-md text-[13px] transition-all ${
                isPast
                  ? "border border-primary-container/60 bg-primary-container/20 text-primary-container font-medium"
                  : "border border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Past projects
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div
          ref={gridContainerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] [perspective:1400px]"
        >
          {/* Big Map Card (The ONLY link to /map) */}
          <Link
            href="/map"
            aria-label="Open interactive map of India"
            className="map-card group relative col-span-1 sm:col-span-2 row-span-1 sm:row-span-2 flex min-h-[300px] sm:min-h-[400px] flex-col justify-end overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-[22px] backdrop-blur-[20px] transition-all duration-300 hover:border-primary-container/60 hover:shadow-[0_0_30px_-6px_rgba(34,211,238,0.4)] hover:scale-[1.01] focus-visible:border-primary-container focus-visible:outline-none"
          >
            {/* Decorative SVG Map of India from prototype */}
            <svg
              viewBox="0 0 420 430"
              role="img"
              aria-label="Decorative schematic map of India"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-60 transition-opacity duration-300 group-hover:opacity-85"
            >
              <polygon
                points={indiaPolygonPoints}
                className="fill-primary-container/10 stroke-primary-container/40"
                strokeWidth="1.5"
              />
              {/* Project coordinate markers */}
              {SAMPLE_PROJECTS.map((p) => {
                const x = (p.lng - 68) * 13 + 20;
                const y = (37.5 - p.lat) * 13 + 10;
                return (
                  <g key={p.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-primary-container transition-all group-hover:r-5"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill="none"
                      className="stroke-primary-container/40"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </svg>

            <span className="absolute top-[14px] left-[14px] z-10 rounded-full border border-white/15 bg-surface-container-lowest/80 px-[10px] py-[3px] font-body-md text-[11px] text-primary-container font-medium">
              Map
            </span>

            <div className="relative z-10 flex flex-col gap-[4px]">
              <h3 className="font-body-md text-[20px] sm:text-[22px] font-bold text-on-surface group-hover:text-primary transition-colors">
                India map
              </h3>
              <p className="font-body-md text-[13px] text-on-surface-variant max-w-md">
                {filteredProjects.length} project
                {filteredProjects.length === 1 ? "" : "s"} shown. Open the
                interactive map to inspect sites and spatial telemetry.
              </p>
            </div>
          </Link>

          {/* Project Cards */}
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleSelectProject}
            />
          ))}

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="col-span-full rounded-[16px] border border-dashed border-white/15 bg-white/5 p-[36px] text-center font-body-md text-on-surface-variant">
              {searchQuery ? (
                <>
                  No projects found for &ldquo;{searchQuery}&rdquo;. The live
                  site will also search within 10 km of any place you type.
                </>
              ) : (
                <>No projects match these filters. Try another type.</>
              )}
            </div>
          )}
        </div>

        {/* Required design review notice */}
        <p className="mt-[24px] font-body-md text-[12px] text-on-surface-variant">
          Sample data for design review.
        </p>
      </main>

      {/* Detail Slideout Panel */}
      {selectedProject && (
        <ProjectPanel
          project={selectedProject}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
