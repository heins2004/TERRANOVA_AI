import Link from "next/link";
import { cookies } from "next/headers";

import { getSessionCookieName } from "@/lib/auth";

const featureCards = [
  {
    title: "Urban Planning Intelligence",
    description:
      "Coordinate growth scenarios, land-use reviews, and capital projects through a single planning surface.",
  },
  {
    title: "GIS-Ready Operations",
    description:
      "Prepare location-aware analysis, map layers, and geospatial workflows without fragmenting planning data.",
  },
  {
    title: "AI-Assisted Decisions",
    description:
      "Turn planning inputs into summaries, risk signals, and report-ready outputs for faster city action.",
  },
];

const workflowItems = [
  "Planning and zoning reviews",
  "Infrastructure and mobility coordination",
  "AI analysis and reports",
  "Citizen and government service workflows",
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has(getSessionCookieName());
  const primaryHref = isAuthenticated ? "/home" : "/register";
  const secondaryHref = isAuthenticated ? "/home" : "/login";
  const primaryLabel = isAuthenticated ? "Open Dashboard" : "Get Started";
  const secondaryLabel = isAuthenticated ? "Workspace Access" : "Login";

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,91,211,0.17),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(14,122,88,0.14),transparent_28%),linear-gradient(180deg,#f7faff,#eef4fb)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
          <header className="glass-card flex flex-col gap-4 rounded-[2rem] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-secondary">
                TERRANOVA AI
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                AI-powered urban planning platform
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <a className="transition hover:text-foreground" href="#features">
                Features
              </a>
              <a className="transition hover:text-foreground" href="#workflow">
                Workflow
              </a>
              <a className="transition hover:text-foreground" href="#access">
                Access
              </a>
              <Link
                className="rounded-2xl border border-border bg-surface px-4 py-2.5 font-semibold text-foreground transition hover:bg-surface-muted"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-2xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:opacity-95"
                href="/register"
              >
                Register
              </Link>
            </nav>
          </header>

          <div className="grid gap-6 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-10">
            <section className="hero-panel rounded-[2.5rem] px-7 py-10 text-primary-foreground sm:px-10 sm:py-12">
              <p className="text-sm uppercase tracking-[0.32em] text-white/74">
                Smart City Operations
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                TERRANOVA AI helps planning teams act faster with clear urban intelligence.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                Bring together planning context, GIS-ready workflows, and AI-assisted analysis
                in one platform designed for modern public-sector coordination.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  className="rounded-2xl bg-white px-5 py-3 text-center font-semibold text-foreground transition hover:bg-white/92"
                  href={primaryHref}
                >
                  {primaryLabel}
                </Link>
                <Link
                  className="rounded-2xl border border-white/18 bg-white/10 px-5 py-3 text-center font-semibold text-white transition hover:bg-white/15"
                  href={secondaryHref}
                >
                  {secondaryLabel}
                </Link>
              </div>
            </section>

            <section className="glass-card rounded-[2.5rem] p-7 sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-secondary">
                Platform Snapshot
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-accent/55 p-5">
                  <p className="text-sm text-muted-foreground">Protected Application Entry</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">/home</p>
                </div>
                <div className="rounded-[1.75rem] bg-accent/55 p-5">
                  <p className="text-sm text-muted-foreground">Access Model</p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    Public landing, authenticated workspace
                  </p>
                </div>
                <div className="rounded-[1.75rem] bg-accent/55 p-5 sm:col-span-2">
                  <p className="text-sm font-semibold text-foreground">What this means</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Visitors can explore TERRANOVA AI publicly, but dashboard access, GIS tools,
                    reports, and planning actions remain behind authentication.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8" id="features">
        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => (
            <article className="glass-card rounded-[2rem] p-6" key={card.title}>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-secondary">
                Core Feature
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-foreground">{card.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8" id="workflow">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="glass-card rounded-[2rem] p-7 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-secondary">
              Urban Workflow
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-foreground">
              Public-facing information outside, operational capability inside.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              TERRANOVA AI separates open platform discovery from authenticated city operations.
              That keeps the entry experience approachable while reserving actionable workflows
              for verified users.
            </p>
          </article>

          <article className="glass-card rounded-[2rem] p-7 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {workflowItems.map((item) => (
                <div className="rounded-[1.75rem] border border-border bg-surface px-5 py-5" key={item}>
                  <p className="text-sm font-semibold text-foreground">{item}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Protected after sign-in to keep operational city workflows behind the frontend
                    access boundary.
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8" id="access">
        <div className="glass-card rounded-[2.25rem] px-7 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-secondary">
                Access TERRANOVA AI
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-foreground">
                Use the landing page publicly. Use the platform securely.
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Continue to registration, sign in with an existing account, or enter the protected
                home dashboard if your session is already active.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="rounded-2xl bg-primary px-5 py-3 text-center font-semibold text-primary-foreground transition hover:opacity-95"
                href={primaryHref}
              >
                {primaryLabel}
              </Link>
              <Link
                className="rounded-2xl border border-border bg-surface px-5 py-3 text-center font-semibold text-foreground transition hover:bg-surface-muted"
                href="/login"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>TERRANOVA AI</p>
          <p>Urban planning, GIS, and AI workflows for coordinated city delivery.</p>
        </div>
      </footer>
    </main>
  );
}
