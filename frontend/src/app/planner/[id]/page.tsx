"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { getPlannerProject, PlannerProject } from "@/services/planner";
import { PlannerStageActions } from "@/components/planner/PlannerStageActions";
import { PlannerEventsTimeline } from "@/components/planner/PlannerEventsTimeline";

export default function PlannerProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params?.id);

  const { user, isReady, isAuthenticated } = useAuth();
  const [project, setProject] = useState<PlannerProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const isPlanner = user?.role === "Urban Planner";

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isPlanner) {
      router.push("/");
      return;
    }
    if (!projectId || isNaN(projectId)) return;

    getPlannerProject(projectId)
      .then(setProject)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load project."))
      .finally(() => setLoading(false));
  }, [projectId, isReady, isAuthenticated, isPlanner, router, refreshKey]);

  function handleActionComplete() {
    setRefreshKey((prev) => prev + 1);
  }

  if (!isReady || (isAuthenticated && !isPlanner)) {
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
        <div className="mx-auto max-w-6xl">
          <div className="mb-[24px]">
            <Link
              href="/planner"
              className="inline-flex items-center gap-[6px] font-data-mono text-xs text-primary hover:underline"
            >
              &larr; BACK TO PLANNER DASHBOARD
            </Link>
          </div>

          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-[32px] text-center">
              <p className="font-data-mono text-sm text-on-surface-variant">LOADING PROJECT DETAILS...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-[24px]">
              <p className="font-data-mono text-sm text-danger">{error}</p>
              <Link
                href="/planner"
                className="mt-[12px] inline-block font-data-mono text-xs text-primary hover:underline"
              >
                RETURN TO DASHBOARD
              </Link>
            </div>
          ) : !project ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-[32px]">
              <p className="font-data-mono text-sm text-on-surface-variant">PROJECT NOT FOUND.</p>
            </div>
          ) : (
            <div className="space-y-[32px]">
              {/* Project Header Card */}
              <div className="glass-card rounded-xl border border-white/10 bg-white/[0.02] p-[24px]">
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                  <div>
                    <div className="flex items-center gap-[8px] font-data-mono text-[11px] text-primary">
                      <span>PROJECT #{project.id}</span>
                      <span>•</span>
                      <span>{project.city || "ALL CITIES"}</span>
                    </div>
                    <h1 className="mt-[6px] font-display-md text-[26px] font-semibold text-foreground">
                      {project.title}
                    </h1>
                    <p className="mt-[8px] max-w-3xl text-sm leading-relaxed text-on-surface-variant">
                      {project.description || "No project description provided."}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-[8px]">
                    <span className="rounded border border-primary-container/60 bg-primary-container/10 px-[10px] py-[4px] font-data-mono text-xs text-primary font-semibold uppercase">
                      {project.stage}
                    </span>
                    <span className="font-data-mono text-[11px] text-on-surface-variant">
                      STATUS: {project.status}
                    </span>
                  </div>
                </div>

                {/* Key Metadata (No budgets of unassigned projects, no user emails) */}
                <div className="mt-[20px] grid grid-cols-2 gap-[16px] border-t border-white/10 pt-[16px] sm:grid-cols-3 font-data-mono text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Category</span>
                    <span className="text-foreground">{project.category || "General"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Timeline</span>
                    <span className="text-foreground">
                      {project.start_date || "TBD"} &rarr; {project.end_date || "TBD"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Planner Deadline</span>
                    <span className="text-foreground">
                      {project.planner_deadline
                        ? new Date(project.planner_deadline).toLocaleString("en-IN")
                        : "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage Specific Actions */}
              <PlannerStageActions
                project={project}
                onActionComplete={handleActionComplete}
              />

              {/* Events Timeline */}
              <PlannerEventsTimeline
                projectId={project.id}
                refreshTrigger={refreshKey}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
