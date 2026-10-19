"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { getGovProject, getProjectEvents, GovProject, GovProjectEvent } from "@/services/gov";
import { GovStageActions } from "@/components/gov/GovStageActions";
import { GovEventsTimeline } from "@/components/gov/GovEventsTimeline";
import { GovEditModal } from "@/components/gov/GovEditModal";
import { GovConsultationsManager } from "@/components/gov/GovConsultationsManager";

export default function GovProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = Number(params.id);

  const { user, isReady, isAuthenticated } = useAuth();
  const [project, setProject] = useState<GovProject | null>(null);
  const [events, setEvents] = useState<GovProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const isOfficial = user?.role === "Government Official";

  const loadData = useCallback(() => {
    if (isNaN(projectId)) return;
    Promise.all([
      getGovProject(projectId),
      getProjectEvents(projectId).catch(() => []),
    ])
      .then(([proj, evs]) => {
        setProject(proj);
        setEvents(evs);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load project details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

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
    void loadData();
  }, [isReady, isAuthenticated, isOfficial, router, loadData]);

  if (!isReady || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
        <TopBar user={user} />
        <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
          <p className="font-data-mono text-sm text-on-surface-variant">LOADING PROJECT DETAILS...</p>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
        <TopBar user={user} />
        <main className="flex-1 px-[24px] py-[32px]">
          <div className="mx-auto max-w-4xl rounded-[12px] border border-danger/40 bg-danger/10 p-[24px]">
            <h2 className="font-sans text-[20px] font-bold text-danger">Error Loading Project</h2>
            <p className="mt-[8px] text-sm text-white">{error || "Project not found or unauthorized."}</p>
            <Link
              href="/gov"
              className="mt-[16px] inline-block font-data-mono text-xs uppercase text-primary hover:underline"
            >
              ← Back to Government Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />
      <main className="flex-1 px-[24px] py-[32px]">
        <div className="mx-auto max-w-5xl space-y-[28px]">
          {/* Header navigation & title */}
          <div>
            <div className="flex items-center gap-[8px] font-data-mono text-[11px] text-on-surface-variant uppercase">
              <Link href="/gov" className="hover:text-primary transition-colors">Official Portal</Link>
              <span>/</span>
              <span>Project #{project.id}</span>
            </div>

            <div className="mt-[8px] flex flex-wrap items-start justify-between gap-[16px]">
              <div>
                <div className="flex items-center gap-[10px]">
                  <span className="rounded border border-primary-container/40 bg-primary-container/15 px-[10px] py-[3px] font-data-mono text-[11px] font-semibold text-primary uppercase">
                    {project.stage}
                  </span>
                  <span className="font-data-mono text-xs text-on-surface-variant uppercase">
                    City: {project.city ?? "National"}
                  </span>
                </div>
                <h1 className="mt-[8px] font-sans text-[26px] font-bold text-white tracking-tight">
                  {project.title}
                </h1>
                {project.description && (
                  <p className="mt-[6px] text-sm text-on-surface-variant max-w-3xl">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-4 rounded-[12px] border border-white/10 bg-surface-container-lowest/70 p-[16px]">
            <div>
              <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Category</p>
              <p className="mt-[2px] text-sm font-medium text-white">{project.category ?? "General"}</p>
            </div>
            <div>
              <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Budget</p>
              <p className="mt-[2px] font-data-mono text-sm font-semibold text-white">
                {project.budget != null ? `₹${Number(project.budget).toLocaleString("en-IN")}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Dates</p>
              <p className="mt-[2px] font-data-mono text-xs text-white">
                {project.start_date ?? "—"} to {project.end_date ?? "—"}
              </p>
            </div>
            <div>
              <p className="font-data-mono text-[10px] text-on-surface-variant uppercase">Assigned Planner</p>
              <p className="mt-[2px] font-data-mono text-xs text-primary font-semibold">
                {project.planner_name ?? (project.planner_id ? `Planner #${project.planner_id}` : "None")}
              </p>
            </div>
          </div>

          {/* Stage Action Controls */}
          <section>
            <h3 className="mb-[12px] font-sans text-[16px] font-semibold text-white tracking-wide">
              Stage Operations
            </h3>
            <GovStageActions
              project={project}
              onRefresh={loadData}
              onOpenEdit={() => setShowEditModal(true)}
            />
          </section>

          {/* Consultations Manager (Deployed Stages) */}
          {["OpenForResponse", "InProgress", "Completed", "Halted"].includes(project.stage) && (
            <GovConsultationsManager project={project} />
          )}

          {/* Events & Rejection Timeline */}
          <GovEventsTimeline project={project} events={events} />

          {/* Edit Modal (Draft / Approved final edit) */}
          {showEditModal && (
            <GovEditModal
              project={project}
              onClose={() => setShowEditModal(false)}
              onSuccess={loadData}
            />
          )}
        </div>
      </main>
    </div>
  );
}
