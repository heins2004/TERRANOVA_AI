"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import {
  acceptInvite,
  declineInvite,
  getPlannerProject,
  getPlannerProjects,
  PlannerProject,
} from "@/services/planner";
import { PendingInvitesSection } from "@/components/planner/PendingInvitesSection";

const STAGE_GROUPS = [
  { key: "site_proposed", label: "Site Proposed", stages: ["Site proposed"] },
  { key: "under_consideration", label: "Under Consideration", stages: ["Under consideration"] },
  { key: "approved", label: "Approved", stages: ["Approved"] },
  {
    key: "deployed",
    label: "Deployed Stages",
    stages: ["OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"],
  },
];

function PlannerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<PlannerProject[]>([]);
  const [invites, setInvites] = useState<PlannerProject[]>([]);
  const [inviteIdInput, setInviteIdInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const isSubmittingRef = useRef(false);

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

    getPlannerProjects()
      .then(async (list) => {
        setProjects(list.filter((p) => p.stage !== "Draft" && p.stage !== "Planner invited"));

        const pendingFromList = list.filter((p) => p.stage === "Planner invited");
        const foundInvites = [...pendingFromList];

        const urlInviteId = searchParams.get("invite");
        if (urlInviteId && !foundInvites.some((p) => p.id === Number(urlInviteId))) {
          try {
            const invProj = await getPlannerProject(Number(urlInviteId));
            if (invProj.stage === "Planner invited") {
              foundInvites.push(invProj);
            }
          } catch {
            // Ignore
          }
        }
        setInvites(foundInvites);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load planner data."))
      .finally(() => setLoading(false));
  }, [isReady, isAuthenticated, isPlanner, router, searchParams]);

  async function handleFindInvite(e: React.FormEvent) {
    e.preventDefault();
    const pid = parseInt(inviteIdInput.trim(), 10);
    if (isNaN(pid) || pid <= 0) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      setError("");
      const p = await getPlannerProject(pid);
      if (p.stage === "Planner invited") {
        if (!invites.some((item) => item.id === p.id)) {
          setInvites((prev) => [p, ...prev]);
        }
      } else {
        router.push(`/planner/${p.id}`);
      }
      setInviteIdInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to find invitation for project.");
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function handleAccept(projectId: number) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setActionLoadingId(projectId);
    try {
      setError("");
      await acceptInvite(projectId);
      router.push(`/planner/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite.");
      isSubmittingRef.current = false;
      setActionLoadingId(null);
    }
  }

  async function handleDecline(projectId: number) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setActionLoadingId(projectId);
    try {
      setError("");
      await declineInvite(projectId);
      setInvites((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline invite.");
    } finally {
      isSubmittingRef.current = false;
      setActionLoadingId(null);
    }
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
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-wrap items-end justify-between gap-[16px]">
            <div>
              <p className="font-label-caps text-label-caps tracking-widest text-primary">
                URBAN PLANNING PORTAL
              </p>
              <h1 className="mt-[8px] font-display-md text-display-md">Planner Dashboard</h1>
              <p className="mt-[8px] text-sm text-on-surface-variant">
                Manage invitations, site proposals, and deploy approvals.
              </p>
            </div>
            <form onSubmit={handleFindInvite} className="flex items-center gap-[8px]">
              <input
                type="number"
                placeholder="Project ID invite"
                value={inviteIdInput}
                onChange={(e) => setInviteIdInput(e.target.value)}
                className="w-[160px] rounded border border-white/15 bg-white/[0.03] px-[12px] py-[8px] font-data-mono text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container/80 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inviteIdInput.trim()}
                className="h-[34px] rounded border border-primary-container/60 px-[14px] font-data-mono text-[11px] font-semibold uppercase tracking-wider text-primary hover:bg-primary-container/10 disabled:opacity-40"
              >
                OPEN
              </button>
            </form>
          </header>

          {error && <p className="mt-[20px] font-data-mono text-sm text-danger">{error}</p>}

          {/* 1. Pending Invites at Top */}
          <PendingInvitesSection
            invites={invites}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />

          {/* 2. Assigned Projects Grouped by Stage */}
          <section className="mt-[48px]">
            <div className="border-b border-white/10 pb-[12px]">
              <h2 className="font-display-md text-[20px] font-semibold uppercase tracking-wide text-foreground">
                Assigned Projects
              </h2>
            </div>

            {loading ? (
              <p className="mt-[16px] font-data-mono text-sm text-on-surface-variant">LOADING PROJECTS...</p>
            ) : projects.length === 0 ? (
              <div className="mt-[16px] rounded-xl border border-white/10 bg-white/[0.02] p-[24px]">
                <p className="font-data-mono text-sm text-on-surface-variant">NO ASSIGNED PROJECTS FOUND.</p>
              </div>
            ) : (
              <div className="mt-[24px] space-y-[32px]">
                {STAGE_GROUPS.map((group) => {
                  const stageProjects = projects.filter((p) => group.stages.includes(p.stage));
                  if (stageProjects.length === 0) return null;

                  return (
                    <div key={group.key}>
                      <div className="flex items-center gap-[10px] mb-[14px]">
                        <span className="h-[6px] w-[6px] rounded-full bg-primary" />
                        <h3 className="font-display-md text-[16px] font-semibold uppercase text-primary">
                          {group.label} ({stageProjects.length})
                        </h3>
                      </div>

                      <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-3">
                        {stageProjects.map((proj) => (
                          <Link
                            key={proj.id}
                            href={`/planner/${proj.id}`}
                            className="glass-card block rounded-xl border border-white/10 bg-white/[0.02] p-[20px] transition hover:border-primary-container/60 hover:bg-white/[0.04]"
                          >
                            <div className="flex items-start justify-between gap-[10px]">
                              <span className="font-data-mono text-[10px] uppercase text-on-surface-variant">
                                #{proj.id} • {proj.city || "INDIA"}
                              </span>
                              <span className="rounded border border-primary-container/40 bg-primary-container/10 px-[6px] py-[2px] font-data-mono text-[10px] text-primary">
                                {proj.stage}
                              </span>
                            </div>

                            <h4 className="mt-[8px] font-display-md text-[16px] font-medium text-foreground line-clamp-1">
                              {proj.title}
                            </h4>

                            <p className="mt-[4px] text-xs text-on-surface-variant line-clamp-2">
                              {proj.description || "No description provided."}
                            </p>

                            <div className="mt-[16px] flex items-center justify-between border-t border-white/10 pt-[10px] font-data-mono text-[11px] text-on-surface-variant">
                              <span>CATEGORY: {proj.category || "GENERAL"}</span>
                              <span className="text-primary hover:underline">VIEW &rarr;</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function PlannerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
          <TopBar />
          <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
            <p className="font-data-mono text-sm text-on-surface-variant">LOADING PLANNER PORTAL...</p>
          </main>
        </div>
      }
    >
      <PlannerDashboardContent />
    </Suspense>
  );
}
