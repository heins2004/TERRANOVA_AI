"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { getGovProjects, GovProject } from "@/services/gov";

const STAGE_ORDER: { key: string; label: string; stages: string[] }[] = [
  { key: "draft", label: "Draft", stages: ["Draft"] },
  { key: "planner_invited", label: "Planner Invited", stages: ["Planner invited"] },
  { key: "site_proposed", label: "Site Proposed", stages: ["Site proposed"] },
  { key: "under_consideration", label: "Under Consideration", stages: ["Under consideration"] },
  { key: "approved", label: "Approved", stages: ["Approved"] },
  { key: "deployed", label: "Deployed Stages", stages: ["OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"] },
];

export default function GovDashboardPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<GovProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOfficial = user?.role === "Government Official";

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isOfficial) {
      router.push("/");
      return;
    }

    getGovProjects()
      .then(setProjects)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load projects."))
      .finally(() => setLoading(false));
  }, [isReady, isAuthenticated, isOfficial, router]);

  if (!isReady || (isAuthenticated && !isOfficial)) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
        <TopBar user={user} />
        <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
          <p className="font-data-mono text-sm text-on-surface-variant">AUTHENTICATING...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />
      <main className="flex-1 px-[24px] py-[32px]">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-[16px] border-b border-white/10 pb-[24px]">
            <div>
              <p className="font-data-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
                GOVERNMENT WORKFLOW PORTAL
              </p>
              <h1 className="mt-[6px] font-sans text-[28px] font-bold tracking-tight text-white">
                Official Projects Management
              </h1>
              <p className="mt-[4px] text-sm text-on-surface-variant">
                Manage project creation, planner collaboration, proposal evaluation, and public deployment.
              </p>
            </div>
            <Link
              href="/gov/new"
              id="gov-new-project-btn"
              className="inline-flex items-center gap-[8px] rounded border border-primary-container bg-primary-container/15 px-[16px] py-[10px] font-data-mono text-[12px] font-semibold tracking-wider text-primary uppercase transition-all hover:bg-primary-container/25 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New project</span>
            </Link>
          </div>

          {error && (
            <div className="mt-[20px] rounded border border-danger/40 bg-danger/10 p-[16px] text-danger text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-[48px] text-center">
              <p className="font-data-mono text-sm text-on-surface-variant">LOADING OFFICIAL PROJECTS...</p>
            </div>
          ) : (
            <div className="mt-[32px] space-y-[40px]">
              {STAGE_ORDER.map((group) => {
                const groupProjects = projects.filter((p) => group.stages.includes(p.stage));
                return (
                  <section key={group.key} className="space-y-[16px]">
                    <div className="flex items-center gap-[12px]">
                      <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
                        {group.label}
                      </h2>
                      <span className="rounded-full border border-white/15 bg-white/5 px-[8px] py-[2px] font-data-mono text-[11px] text-on-surface-variant">
                        {groupProjects.length}
                      </span>
                    </div>

                    {groupProjects.length === 0 ? (
                      <div className="rounded border border-dashed border-white/10 p-[20px] text-center">
                        <p className="font-data-mono text-[12px] text-on-surface-variant">
                          NO PROJECTS IN THIS STAGE
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
                        {groupProjects.map((project) => (
                          <Link
                            key={project.id}
                            href={`/gov/${project.id}`}
                            id={`gov-project-card-${project.id}`}
                            className="group block rounded-[12px] border border-white/10 bg-surface-container-lowest/90 p-[20px] transition-all hover:border-primary/50 hover:bg-white/[0.03] hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                          >
                            <div className="flex items-start justify-between gap-[10px]">
                              <span className="rounded border border-primary-container/40 bg-primary-container/10 px-[8px] py-[3px] font-data-mono text-[10px] font-semibold text-primary uppercase">
                                {project.stage}
                              </span>
                              <span className="font-data-mono text-[11px] uppercase text-on-surface-variant">
                                {project.city ?? "No City"}
                              </span>
                            </div>

                            <h3 className="mt-[12px] font-sans text-[16px] font-semibold text-white line-clamp-1 group-hover:text-primary transition-colors">
                              {project.title}
                            </h3>

                            {project.description && (
                              <p className="mt-[6px] text-[13px] text-on-surface-variant line-clamp-2">
                                {project.description}
                              </p>
                            )}

                            <div className="mt-[16px] pt-[12px] border-t border-white/10 flex items-center justify-between text-[12px]">
                              <div>
                                <span className="text-on-surface-variant font-data-mono text-[11px]">BUDGET: </span>
                                <span className="font-data-mono text-white font-semibold">
                                  {project.budget != null ? `₹${Number(project.budget).toLocaleString("en-IN")}` : "Not set"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-on-surface-variant font-data-mono text-[11px]">PLANNER: </span>
                                <span className="font-data-mono text-primary font-semibold">
                                  {project.planner_name ?? (project.planner_id ? `ID #${project.planner_id}` : "Unassigned")}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
