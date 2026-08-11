"use client";

import { LogoutButton } from "@/components/logout-button";
import { AuthUser } from "@/lib/auth";

const overviewCards = [
  {
    label: "Active Planning Cases",
    value: "12",
    detail: "Zoning, mobility, and resilience reviews in progress.",
  },
  {
    label: "GIS Layers Ready",
    value: "28",
    detail: "Base layers and overlays prepared for city analysis.",
  },
  {
    label: "AI Insight Requests",
    value: "07",
    detail: "Pending planning summaries and scenario comparisons.",
  },
];

const quickActions = [
  "Review land-use analysis",
  "Open GIS workspace",
  "Draft compliance report",
  "Check citizen service queue",
];

const feedItems = [
  "Mobility corridor impact review is awaiting approval.",
  "New satellite layer package is ready for validation.",
  "AI summary flagged a density mismatch in Ward 4.",
];

type HomeDashboardProps = {
  user: AuthUser;
};

export function HomeDashboard({ user }: HomeDashboardProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:flex-row lg:gap-6 lg:px-8">
        <aside className="hero-panel rounded-[2rem] px-6 py-8 text-primary-foreground lg:w-80 lg:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/72">
                TERRANOVA AI
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight">
                Urban Planning Command Center
              </h1>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-10 rounded-[1.75rem] border border-white/16 bg-white/10 p-5">
            <p className="text-sm text-white/72">Signed in as</p>
            <p className="mt-2 text-xl font-semibold">{user.full_name}</p>
            <p className="mt-1 text-sm text-white/78">{user.email}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/62">
              Role: {user.role}
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {["Dashboard Overview", "GIS Workspace", "AI Analysis", "Reports", "Notifications"].map(
              (item) => (
                <div
                  className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/86"
                  key={item}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </aside>

        <section className="mt-6 flex-1 space-y-6 lg:mt-0">
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-secondary">
              Welcome
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">
              Smart-city decisions with faster planning context.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
              This protected workspace is the authenticated entry point for TERRANOVA AI for{" "}
              {user.full_name}. Backend tools can replace these placeholders later without
              changing the route structure or the frontend session model.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {overviewCards.map((card) => (
              <article className="glass-card rounded-[1.75rem] p-6" key={card.label}>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-4 text-4xl font-semibold text-foreground">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {card.detail}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="glass-card rounded-[2rem] p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-foreground">
                Urban Planning Overview
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Regional growth scenarios, zoning reviews, and infrastructure alignment can be
                connected here once the operational APIs are available.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-accent/55 p-5">
                  <p className="text-sm font-semibold text-foreground">GIS / Map Section</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Placeholder for map canvases, layer controls, and geospatial filters.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-accent/55 p-5">
                  <p className="text-sm font-semibold text-foreground">AI Insights</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Placeholder for scenario analysis, policy recommendations, and planning risk
                    summaries.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-accent/55 p-5">
                  <p className="text-sm font-semibold text-foreground">Reports</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Placeholder for exportable reports, approvals, and stakeholder packets.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-accent/55 p-5">
                  <p className="text-sm font-semibold text-foreground">Citizen Services</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Placeholder for permit requests, feedback workflows, and public engagement.
                  </p>
                </div>
              </div>
            </article>

            <div className="space-y-6">
              <article className="glass-card rounded-[2rem] p-6">
                <h3 className="text-xl font-semibold text-foreground">Quick Actions</h3>
                <div className="mt-5 space-y-3">
                  {quickActions.map((item) => (
                    <button
                      className="w-full rounded-2xl bg-primary px-4 py-3 text-left text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                      key={item}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </article>

              <article className="glass-card rounded-[2rem] p-6">
                <h3 className="text-xl font-semibold text-foreground">Notifications</h3>
                <div className="mt-5 space-y-3">
                  {feedItems.map((item) => (
                    <div
                      className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted-foreground"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
