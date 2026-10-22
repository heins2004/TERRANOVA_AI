"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { getGovProject, getProjectEvents, GovProject, GovProjectEvent } from "@/services/gov";
import { GovProjectHeader } from "@/components/gov/GovProjectHeader";
import { GovDetailsSection } from "@/components/gov/GovDetailsSection";
import { GovSiteAreaTabSection } from "@/components/gov/GovSiteAreaTabSection";
import { GovPlannerTabSection } from "@/components/gov/GovPlannerTabSection";
import { GovConsultationsTabSection } from "@/components/gov/GovConsultationsTabSection";
import { GovTimelineTabSection } from "@/components/gov/GovTimelineTabSection";
import { GovEditModal } from "@/components/gov/GovEditModal";

function GovProjectDetailContent() {
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-[16px] md:px-[24px] py-[24px] md:py-[32px]">
        <div className="space-y-[32px]">
          <GovProjectHeader
            project={project}
            onRefresh={loadData}
            onOpenEdit={() => setShowEditModal(true)}
          />

          <GovDetailsSection project={project} />
          <GovSiteAreaTabSection project={project} />
          <GovPlannerTabSection project={project} onRefresh={loadData} />
          <GovConsultationsTabSection project={project} />
          <GovTimelineTabSection project={project} events={events} />
        </div>
      </main>

      {/* Edit Modal (Draft / Approved final edit) */}
      {showEditModal && (
        <GovEditModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

export default function GovProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
          <TopBar />
          <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
            <p className="font-data-mono text-sm text-on-surface-variant">LOADING PROJECT DETAILS...</p>
          </main>
        </div>
      }
    >
      <GovProjectDetailContent />
    </Suspense>
  );
}
