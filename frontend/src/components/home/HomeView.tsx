"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  HudBackground,
  HudCornerBrackets,
  HudMetricTile,
  HudPanel,
} from "@/components/hud/Hud";
import { TopBar } from "@/components/layout/TopBar";
import { AuthUser } from "@/lib/auth";
import { getUsers } from "@/services/admin";
import { Complaint, getComplaints } from "@/services/complaints";
import { getConsultations } from "@/services/consultations";
import { getDocuments } from "@/services/documents";
import {
  getInfrastructureAssets,
  InfrastructureAsset,
} from "@/services/infrastructure";
import { getProjects, Project } from "@/services/projects";
import { projectStatusClasses } from "@/components/projects/StatusBadge";

const NationalCoverageMap = dynamic(
  () =>
    import("@/components/dashboard/NationalCoverageMap").then(
      (m) => m.NationalCoverageMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[260px] w-full items-center justify-center font-data-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
        INITIALIZING SPATIAL MATRIX...
      </div>
    ),
  }
);

type HomeViewProps = {
  user: AuthUser | null;
  isRevealed?: boolean;
  isInstant?: boolean;
  getStaggerStyle?: (delayMs: number, durationMs?: number) => React.CSSProperties;
  showPlayIntro?: boolean;
  onPlayIntro?: () => void;
  hasIntroPlayed?: boolean;
};

type DashboardData = {
  projects: Project[];
  assets: InfrastructureAsset[];
  complaints?: Complaint[];
  upcomingConsultations?: number;
  documentCount?: number;
  userCount?: number;
};

const staffRoles = ["Urban Planner", "Government Official", "Administrator"];
const needsAttention = (status: string) =>
  status === "Submitted" || status === "UnderReview";

export function HomeView({
  user,
  isRevealed = true,
  isInstant = true,
  getStaggerStyle = () => ({}),
  showPlayIntro = false,
  onPlayIntro,
  hasIntroPlayed = false,
}: HomeViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const isStaff = user ? staffRoles.includes(user.role) : false;

  // Start data loading immediately on mount (so telemetry is ready at reveal)
  useEffect(() => {
    async function loadTelemetry() {
      try {
        setError("");
        if (!user) {
          // GUEST: Only fetch public endpoints. Never call authenticated APIs (zero 401s).
          const [projects, assets] = await Promise.all([
            getProjects(),
            getInfrastructureAssets(),
          ]);
          setData({
            projects,
            assets,
          });
        } else {
          // LOGGED-IN: Fetch user-authorized telemetry
          const [projects, assets, complaints, consultations, documents, users] =
            await Promise.all([
              getProjects(),
              getInfrastructureAssets(),
              getComplaints(),
              getConsultations(),
              isStaff ? getDocuments() : Promise.resolve(undefined),
              user.role === "Administrator"
                ? getUsers()
                : Promise.resolve(undefined),
            ]);
          setData({
            projects,
            assets,
            complaints,
            upcomingConsultations: consultations.filter(
              (c) => c.status === "Upcoming"
            ).length,
            documentCount: documents?.length,
            userCount: users?.length,
          });
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load telemetry from database."
        );
      }
    }
    void loadTelemetry();
  }, [user, isStaff]);

  const recentProjects = useMemo(
    () =>
      data?.projects
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 4) ?? [],
    [data]
  );

  // Authenticated module list (single source of truth)
  const authenticatedNav = useMemo(() => {
    if (!user) return [];
    return [
      { label: "Urban Projects", href: "/projects", icon: "apartment" },
      { label: "Infrastructure Grid", href: "/infrastructure", icon: "construction" },
      ...(user.role !== "Citizen"
        ? [{ label: "Planning Workspace", href: "/planning", icon: "architecture" }]
        : []),
      { label: "Civic Complaints", href: "/complaints", icon: "report_problem" },
      { label: "Consultation Matrix", href: "/consultations", icon: "forum" },
      { label: "Document Archive", href: "/documents", icon: "folder_open" },
      ...(user.role === "Administrator"
        ? [{ label: "Administration", href: "/admin", icon: "admin_panel_settings" }]
        : []),
    ];
  }, [user]);

  // Guest modules list (5 common modules, dimmed with lock, NOT links and NOT buttons)
  const guestModules = [
    { label: "Urban Projects", icon: "apartment" },
    { label: "Infrastructure Grid", icon: "construction" },
    { label: "Civic Complaints", icon: "report_problem" },
    { label: "Consultation Matrix", icon: "forum" },
    { label: "Document Archive", icon: "folder_open" },
  ];

  // Stat tiles: show ONLY tiles whose data backend returns without authentication for guest
  const summaryMetrics = useMemo(() => {
    if (!data) return [];

    const publicBase = [
      {
        label: "Active Projects",
        value: data.projects.length,
        subLabel: "Metropolitan scale initiatives",
        accent: true,
      },
      {
        label: "Critical Assets",
        value: data.assets.filter(
          (a) => a.condition === "Poor" || a.condition === "Critical"
        ).length,
        subLabel: "Require inspection / repair",
        accent: false,
      },
    ];

    // GUEST: only show the 2 unauthenticated metric tiles; hide tiles requiring login
    if (!user) {
      return publicBase;
    }

    const baseWithConsultations = [
      ...publicBase,
      {
        label: "Upcoming Consultations",
        value: data.upcomingConsultations ?? 0,
        subLabel: "Open public review sessions",
        accent: false,
      },
    ];

    if (user.role === "Citizen") {
      const complaints = data.complaints ?? [];
      return [
        ...baseWithConsultations,
        {
          label: "My Complaints",
          value: complaints.length,
          subLabel: "Submitted citizen reports",
          accent: false,
        },
        {
          label: "Complaints In Progress",
          value: complaints.filter((c) => needsAttention(c.status)).length,
          subLabel: "Under municipal review",
          accent: false,
        },
      ];
    }

    const staffMetrics = [
      ...baseWithConsultations,
      {
        label: "Complaints Needing Review",
        value: (data.complaints ?? []).filter((c) => needsAttention(c.status)).length,
        subLabel: "Pending triage by department",
        accent: false,
      },
      {
        label: "Repository Documents",
        value: data.documentCount ?? 0,
        subLabel: "Archived planning briefs",
        accent: false,
      },
    ];

    if (user.role === "Administrator") {
      staffMetrics.push({
        label: "Registered Nodes / Users",
        value: data.userCount ?? 0,
        subLabel: "Active platform accounts",
        accent: true,
      });
    }

    return staffMetrics;
  }, [data, user]);

  return (
    <div
      inert={!isRevealed}
      className={`relative min-h-screen w-full text-on-surface overflow-x-hidden flex flex-col justify-between selection:bg-primary-container/30 selection:text-primary ${
        hasIntroPlayed
          ? "bg-[#0a0e17]/88 backdrop-blur-sm"
          : "bg-surface-container-lowest"
      }`}
    >
      {!hasIntroPlayed && <HudBackground />}

      {/* 1. Unified Top Bar with Home, Login/Logout, and Play Intro button */}
      <TopBar
        user={user}
        showPlayIntro={showPlayIntro && !user}
        onPlayIntro={onPlayIntro}
        style={getStaggerStyle(100, 450)}
      />

      {/* 2. Main Command Workspace */}
      <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 flex flex-col px-[20px] py-[24px] lg:flex-row lg:gap-[24px] lg:px-[32px]">
        {/* Left Column: Identity Card above Module List */}
        <aside
          style={getStaggerStyle(180, 450)}
          className="contents lg:flex lg:flex-col lg:gap-[20px] lg:w-[320px] lg:shrink-0"
        >
          {/* Identity Card (Desktop sidebar) */}
          <HudPanel brackets="all" className="hidden lg:block p-[20px]">
            <div className="flex items-center gap-[12px]">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-primary-container/40 bg-primary-container/10">
                <svg
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <p className="font-display-md text-[18px] font-semibold tracking-tight text-primary uppercase">
                  TERRANOVA AI
                </p>
                <p className="flex items-center gap-1.5 font-label-caps text-[9px] tracking-widest text-on-surface-variant">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
                  COMMAND CONSOLE // HUD
                </p>
              </div>
            </div>

            {/* Operator Matrix Card */}
            <div className="mt-[20px] rounded-lg border border-white/10 bg-white/[0.03] p-[16px]">
              <div className="flex items-center justify-between">
                <span className="font-data-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  OPERATOR IDENTITY
                </span>
                <span className="font-data-mono text-[10px] uppercase tracking-widest text-primary-container">
                  {user ? "SECURE_LINK" : "GUEST ACCESS"}
                </span>
              </div>
              <p className="mt-[10px] font-display-md text-[17px] font-semibold text-foreground">
                {user ? user.full_name : "GUEST OPERATOR"}
              </p>
              <p className="mt-[2px] font-data-mono text-[11px] text-muted-foreground break-all">
                {user ? user.email : "Log in to unlock modules"}
              </p>
              <div className="mt-[12px] flex items-center justify-between border-t border-white/10 pt-[10px]">
                <span className="font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                  CLEARANCE
                </span>
                <span
                  className={`rounded border px-[8px] py-[2px] font-data-mono text-[10px] font-semibold uppercase tracking-wider ${
                    user
                      ? "border-primary-container/40 bg-primary-container/10 text-primary"
                      : "border-white/20 bg-white/5 text-on-surface-variant"
                  }`}
                >
                  {user ? user.role : "GUEST"}
                </span>
              </div>
            </div>
          </HudPanel>

          {/* Module List Console: horizontal scrollable chips on mobile, sidebar on desktop */}
          <HudPanel brackets="diagonal" className="order-1 lg:order-none p-[12px] lg:p-[20px]">
            <p className="hidden lg:block font-data-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-[14px]">
              SYSTEM MODULES
            </p>
            <nav className="flex flex-row overflow-x-auto gap-[8px] scrollbar-none py-[2px] lg:flex-col lg:overflow-visible lg:py-0">
              {user
                ? authenticatedNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group shrink-0 flex items-center gap-[8px] lg:gap-[12px] rounded border px-[12px] py-[8px] lg:px-[14px] lg:py-[10px] transition-all whitespace-nowrap ${
                        item.href === "/"
                          ? "border-primary-container/60 bg-primary-container/10 text-primary shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                          : "border-white/10 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/40 hover:bg-white/[0.06] hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] lg:text-[18px] transition-colors ${
                          item.href === "/"
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-label-caps text-[11px] tracking-wider uppercase">
                        {item.label}
                      </span>
                    </Link>
                  ))
                : guestModules.map((item) => (
                    <div
                      key={item.label}
                      role="link"
                      aria-disabled="true"
                      aria-label={`${item.label}, log in required`}
                      className="group shrink-0 flex items-center justify-between gap-[8px] lg:gap-[12px] rounded border border-white/5 bg-white/[0.01] px-[12px] py-[8px] lg:px-[14px] lg:py-[10px] opacity-40 cursor-not-allowed select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-[8px] lg:gap-[12px]">
                        <span
                          className="material-symbols-outlined text-[16px] lg:text-[18px] text-muted-foreground"
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        <span className="font-label-caps text-[11px] tracking-wider uppercase text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <span
                        className="material-symbols-outlined text-[13px] text-muted-foreground/70 ml-2"
                        aria-hidden="true"
                      >
                        lock
                      </span>
                    </div>
                  ))}
            </nav>
          </HudPanel>
        </aside>

        {/* Main Section */}
        <section className="order-2 lg:order-none flex-1 flex flex-col gap-[24px]">
          {/* Header Card */}
          <div style={getStaggerStyle(260, 450)}>
            <HudPanel
              brackets="all"
              className="p-[24px] sm:p-[28px]"
            >
            <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-white/10 pb-[14px]">
              <div className="flex items-center gap-[10px]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
                <span className="font-data-mono text-[11px] uppercase tracking-widest text-primary">
                  {user
                    ? `WORKSPACE ACTIVE // NODE: ${user.role.toUpperCase()}`
                    : "WORKSPACE ACTIVE // NODE: GUEST"}
                </span>
              </div>
              <span className="font-data-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                GRID_REF: TERRANOVA-METRO-01
              </span>
            </div>

            <h1 className="mt-[16px] font-display-md text-[26px] sm:text-[32px] font-semibold tracking-tight text-foreground uppercase">
              {user ? `Command Center // ${user.full_name}` : "COMMAND CENTER // GUEST"}
            </h1>

            {user ? (
              <p className="mt-[8px] max-w-2xl font-body-md text-[14px] leading-relaxed text-muted-foreground">
                Connected to real-time spatial telemetry, infrastructure registries,
                and civic channels. Select an operational module or inspect current
                directives below.
              </p>
            ) : (
              <div>
                <p className="mt-[6px] font-display-md text-[18px] sm:text-[20px] font-medium text-white">
                  Plan the city before it exists.
                </p>
                <p className="mt-[6px] max-w-2xl font-body-md text-[14px] leading-relaxed text-muted-foreground">
                  TERRANOVA AI turns an empty plot into zoning, traffic and growth
                  scenarios in minutes.
                </p>
                <div className="mt-[18px]">
                  <Link
                    href="/register"
                    id="start-a-plan-link"
                    aria-label="Start a plan"
                    className="h-[36px] inline-flex items-center justify-center gap-[8px] rounded border border-primary-container/80 bg-primary-container/15 px-[20px] font-data-mono text-[12px] font-semibold tracking-wider text-primary uppercase transition-all duration-300 hover:bg-primary-container/25 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] active:scale-95"
                  >
                    <span>Start a plan</span>
                    <span
                      className="material-symbols-outlined text-[16px]"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </HudPanel>
        </div>

          {/* System Error Message */}
          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-[16px] font-data-mono text-[12px] text-danger">
              [TELEMETRY_ERROR]: {error}
            </div>
          )}

          {/* Loading State */}
          {!data && !error && (
            <HudPanel brackets="diagonal" className="p-[28px] text-center">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-container border-t-transparent mr-2" />
              <span className="font-data-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
                SYNCHRONIZING SYSTEM TELEMETRY...
              </span>
            </HudPanel>
          )}

          {/* Stat Tiles Grid (Display-only stat tiles) */}
          {data && (
            <div
              style={getStaggerStyle(340, 450)}
              className={`grid gap-[16px] ${
                user
                  ? "sm:grid-cols-2 xl:grid-cols-3"
                  : "sm:grid-cols-2"
              }`}
            >
              {summaryMetrics.map((metric) => (
                <HudMetricTile
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  subLabel={metric.subLabel}
                  accent={metric.accent}
                />
              ))}
            </div>
          )}

          {/* Lower Area: Recent Projects Stream & National Coverage Map */}
          {data && (
            <div
              style={getStaggerStyle(420, 450)}
              className="grid gap-[24px] items-stretch lg:grid-cols-[1.5fr_1fr]"
            >
              {/* Recent Urban Projects */}
              <HudPanel
                brackets="all"
                className="order-2 lg:order-1 h-full p-[24px] flex flex-col"
              >
                <div className="border-b border-white/10 pb-[12px]">
                  <h2 className="font-display-md text-[18px] font-semibold uppercase text-foreground">
                    Recent Urban Projects
                  </h2>
                  <p className="mt-[2px] font-data-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Latest initiatives registered in TERRANOVA AI
                  </p>
                </div>

                <div className="mt-[16px] flex flex-col gap-[10px] flex-1">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group block w-full rounded-lg border border-white/10 bg-white/[0.02] p-[14px] transition-all hover:border-primary-container/60 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-[12px]">
                        <div>
                          <p className="text-[14px] font-medium text-foreground transition-colors group-hover:text-primary">
                            {project.title}
                          </p>
                          <p className="mt-[4px] font-data-mono text-[11px] text-muted-foreground">
                            {project.category ?? "General Planning"}
                            {project.city ? ` · ${project.city}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded border px-[8px] py-[3px] font-data-mono text-[10px] uppercase tracking-wider ${
                            projectStatusClasses[project.status] ??
                            "border-primary-container/30 bg-primary-container/10 text-primary"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </Link>
                  ))}

                  {!recentProjects.length && (
                    <p className="p-[16px] font-data-mono text-[12px] uppercase text-muted-foreground text-center">
                      NO PROJECTS RECORDED IN CURRENT SECTOR
                    </p>
                  )}
                </div>
              </HudPanel>

              {/* National Coverage Map Tile */}
              {user ? (
                <Link
                  href="/map"
                  id="national-coverage-tile"
                  aria-label="Open GIS workspace, National coverage map"
                  className="group block order-1 lg:order-2 h-full min-h-[320px] transition-all"
                >
                  <HudPanel
                    brackets="all"
                    className="h-full p-[20px] flex flex-col transition-all group-hover:border-primary-container/60 group-hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-[10px] mb-[14px]">
                      <div className="whitespace-nowrap">
                        <h2 className="font-display-md text-[16px] font-semibold uppercase text-foreground transition-colors group-hover:text-primary">
                          NATIONAL COVERAGE
                        </h2>
                        <p className="mt-[2px] font-data-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          8 active nodes across India
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                      >
                        arrow_outward
                      </span>
                    </div>

                    <div className="flex-1 min-h-[260px] lg:min-h-[320px] w-full overflow-hidden rounded-lg">
                      <NationalCoverageMap />
                    </div>
                  </HudPanel>
                </Link>
              ) : (
                <div
                  id="national-coverage-tile"
                  className="group block order-1 lg:order-2 h-full min-h-[320px] transition-all"
                >
                  <HudPanel
                    brackets="all"
                    className="h-full p-[20px] flex flex-col"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-[10px] mb-[14px]">
                      <div className="whitespace-nowrap">
                        <h2 className="font-display-md text-[16px] font-semibold uppercase text-foreground">
                          NATIONAL COVERAGE
                        </h2>
                        <p className="mt-[2px] font-data-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          8 active nodes across India
                        </p>
                      </div>
                      <span className="font-data-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-white/10 bg-white/[0.02] px-[8px] py-[3px] rounded">
                        Log in to open the GIS workspace
                      </span>
                    </div>

                    <div className="flex-1 min-h-[260px] lg:min-h-[320px] w-full overflow-hidden rounded-lg">
                      <NationalCoverageMap />
                    </div>
                  </HudPanel>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* 3. Bottom HUD Frame Bar with Corner Readouts */}
      <footer className="relative z-20 w-full border-t border-white/10 bg-surface-container-lowest/85 px-[24px] py-[10px] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between font-data-mono text-[10px] uppercase tracking-widest">
          <span className="text-primary-container font-semibold">
            SYSTEM STATUS: OPERATIONAL
          </span>
          <span className="hidden sm:inline-block text-on-surface-variant/60">
            CORE: POSTGRESQL + POSTGIS // TELEMETRY: ACTIVE
          </span>
          <span className="text-secondary font-semibold">
            NET_ID: TERRANOVA-HUB // ENCRYPTION: AES-256
          </span>
        </div>
      </footer>
    </div>
  );
}
