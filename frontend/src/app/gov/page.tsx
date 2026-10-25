"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarLayout, SidebarItem } from "@/components/layout/SidebarLayout";
import { GovStageGroupSection, StageGroupConfig } from "@/components/gov/GovStageGroupSection";
import { getGovProjects, GovProject } from "@/services/gov";

const STAGE_ORDER: StageGroupConfig[] = [
  { key: "draft", label: "Draft", stages: ["Draft"] },
  { key: "planner-invited", label: "Planner Invited", stages: ["Planner invited"] },
  { key: "site-proposed", label: "Site Proposed", stages: ["Site proposed"] },
  { key: "under-consideration", label: "Under Consideration", stages: ["Under consideration"] },
  { key: "approved", label: "Approved", stages: ["Approved"] },
  { key: "deployed-stages", label: "Deployed Stages", stages: ["OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"] },
];

const GOV_LIST_NAV_ITEMS: SidebarItem[] = [
  { key: "draft", label: "Draft", icon: "edit_note" },
  { key: "planner-invited", label: "Planner Invited", icon: "person_add" },
  { key: "site-proposed", label: "Site Proposed", icon: "location_searching" },
  { key: "under-consideration", label: "Under Consideration", icon: "fact_check" },
  { key: "approved", label: "Approved", icon: "verified" },
  { key: "deployed-stages", label: "Deployed Stages", icon: "rocket_launch" },
  { key: "chat", label: "Chat", icon: "chat", href: "/chat" },
];

function GovDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<GovProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOfficial = user?.role === "Government Official";

  const rawSection = searchParams.get("section");
  const isValidSection = rawSection && STAGE_ORDER.some((g) => g.key === rawSection);
  const activeSection = isValidSection ? (rawSection as string) : "draft";

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

  const activeGroup = STAGE_ORDER.find((g) => g.key === activeSection) ?? STAGE_ORDER[0];

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />
      <main className="flex-1 w-full">
        <SidebarLayout
          items={GOV_LIST_NAV_ITEMS}
          activeKey={activeSection}
          basePath="/gov"
          navTitle="Project stages"
          idPrefix="gov"
        >
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
              <GovStageGroupSection group={activeGroup} projects={projects} />
            </div>
          )}
        </SidebarLayout>
      </main>
    </div>
  );
}

export default function GovDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
          <TopBar />
          <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
            <p className="font-data-mono text-sm text-on-surface-variant">LOADING OFFICIAL PROJECTS...</p>
          </main>
        </div>
      }
    >
      <GovDashboardContent />
    </Suspense>
  );
}
