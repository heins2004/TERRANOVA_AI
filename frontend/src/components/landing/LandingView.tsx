"use client";

import Link from "next/link";
import {
  HudBackground,
  HudButton,
  HudCornerBrackets,
  HudCornerReadouts,
  HudPanel,
} from "@/components/hud/Hud";

export function LandingView() {
  return (
    <div className="relative min-h-screen w-full bg-surface-container-lowest text-on-surface overflow-x-hidden selection:bg-primary-container/30 selection:text-primary">
      <HudBackground />

      <HudCornerReadouts
        topRight="NET_ID: TERRANOVA-CORE"
        bottomLeft="SYSTEM STATUS: ONLINE"
        bottomRight="ENCRYPTION: AES-256"
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-[24px] pt-[24px] pb-[32px] sm:px-[32px] lg:px-[48px]">
        {/* Top Mission Briefing Bar */}
        <header className="flex flex-wrap items-center justify-between gap-[16px] border-b border-white/10 pb-[20px]">
          <div className="flex items-center gap-[12px]">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-primary-container/40 bg-primary-container/10">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <p className="font-display-md text-[18px] font-semibold tracking-tight text-primary uppercase">
                TERRANOVA AI
              </p>
              <p className="flex items-center gap-2 font-label-caps text-[10px] tracking-wider text-on-surface-variant">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
                ORCHESTRATING THE URBAN FUTURE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-[12px]">
            <HudButton href="/login" size="sm" variant="primary">
              Access System
            </HudButton>
            <HudButton href="/register" size="sm" variant="secondary">
              Initialize Registration
            </HudButton>
          </div>
        </header>

        {/* Hero & Mission Briefing Center */}
        <section className="my-auto py-[48px]">
          <div className="grid gap-[32px] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Column: Mission Overview */}
            <div>
              <div className="mb-[20px] inline-flex items-center gap-[8px] rounded border border-primary-container/40 bg-primary-container/10 px-[12px] py-[6px]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
                <span className="font-data-mono text-[11px] uppercase tracking-widest text-primary">
                  URBAN INTELLIGENCE MATRIX // READY
                </span>
              </div>

              <h1 className="font-display-md text-[38px] sm:text-[48px] font-semibold leading-[1.15] tracking-tight text-foreground uppercase">
                Intelligent Spatial Planning for{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Metropolitan Scale
                </span>
              </h1>

              <p className="mt-[20px] max-w-xl font-body-md text-[16px] leading-[1.7] text-muted-foreground">
                TERRANOVA AI unifies geospatial intelligence, infrastructure
                telemetry, and multi-stakeholder civic participation into an
                integrated command environment for cities of tomorrow.
              </p>

              {/* CTAs */}
              <div className="mt-[36px] flex flex-wrap items-center gap-[16px]">
                <HudButton href="/login" size="lg" variant="primary">
                  Access System
                  <span className="material-symbols-outlined text-[18px]">
                    login
                  </span>
                </HudButton>
                <HudButton href="/register" size="lg" variant="secondary">
                  Initialize Registration
                  <span className="material-symbols-outlined text-[18px]">
                    how_to_reg
                  </span>
                </HudButton>
              </div>

              {/* Quick Spec Highlights */}
              <div className="mt-[40px] grid grid-cols-2 sm:grid-cols-3 gap-[16px] border-t border-white/10 pt-[24px]">
                <div>
                  <p className="font-data-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    CORE GIS ENGINE
                  </p>
                  <p className="mt-[4px] font-data-mono text-[13px] font-semibold text-primary">
                    POSTGIS + OSM
                  </p>
                </div>
                <div>
                  <p className="font-data-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    GOVERNANCE
                  </p>
                  <p className="mt-[4px] font-data-mono text-[13px] font-semibold text-foreground">
                    ROLE-GATED HUD
                  </p>
                </div>
                <div>
                  <p className="font-data-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    SECURITY
                  </p>
                  <p className="mt-[4px] font-data-mono text-[13px] font-semibold text-secondary">
                    PBKDF2-HMAC-256
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Mission Briefing HUD Panels */}
            <div className="flex flex-col gap-[16px]">
              <HudPanel brackets="all" className="p-[24px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
                  <p className="font-data-mono text-[11px] uppercase tracking-widest text-primary">
                    [MODULE 01] GIS SPATIAL WORKSPACE
                  </p>
                  <span className="font-data-mono text-[10px] text-on-surface-variant">
                    ACTIVE
                  </span>
                </div>
                <p className="mt-[12px] text-[13px] leading-relaxed text-muted-foreground">
                  Interactive multi-layer geospatial engine with Overpass OSM
                  amenities, candidate site identification, and flood vulnerability analysis.
                </p>
              </HudPanel>

              <HudPanel brackets="all" className="p-[24px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
                  <p className="font-data-mono text-[11px] uppercase tracking-widest text-primary">
                    [MODULE 02] INFRASTRUCTURE LIFECYCLE
                  </p>
                  <span className="font-data-mono text-[10px] text-on-surface-variant">
                    TELEMETRY
                  </span>
                </div>
                <p className="mt-[12px] text-[13px] leading-relaxed text-muted-foreground">
                  Proactive condition tracking for bridges, water systems, and power networks
                  with automated priority flags for assets needing urgent attention.
                </p>
              </HudPanel>

              <HudPanel brackets="all" className="p-[24px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
                  <p className="font-data-mono text-[11px] uppercase tracking-widest text-primary">
                    [MODULE 03] CIVIC CONSULTATION NETWORK
                  </p>
                  <span className="font-data-mono text-[10px] text-on-surface-variant">
                    VERIFIED
                  </span>
                </div>
                <p className="mt-[12px] text-[13px] leading-relaxed text-muted-foreground">
                  Transparent public feedback channels, urban project proposals, and direct
                  dialogue between citizens, planners, and municipal officials.
                </p>
              </HudPanel>
            </div>
          </div>
        </section>

        {/* Footer Terminal Bar */}
        <footer className="flex flex-wrap items-center justify-between gap-[16px] border-t border-white/10 pt-[20px] font-data-mono text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-[16px]">
            <span>TERRANOVA URBAN OS // v4.2.1</span>
            <span className="text-white/20">|</span>
            <span>STATUS: ALL NODES OPERATIONAL</span>
          </div>
          <div className="flex items-center gap-[16px]">
            <Link
              href="/login"
              className="text-primary hover:text-primary-container transition"
            >
              ACCESS PORTAL
            </Link>
            <span className="text-white/20">|</span>
            <Link
              href="/register"
              className="text-on-surface-variant hover:text-primary transition"
            >
              REGISTER NODE
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
