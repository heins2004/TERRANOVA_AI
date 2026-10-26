"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarLayout, SidebarItem } from "@/components/layout/SidebarLayout";
import {
  acceptInvite,
  declineInvite,
  getPendingInvites,
  getPlannerProjects,
  PlannerPendingInvite,
  PlannerProject,
} from "@/services/planner";
import { getPlannerCredentials, CredentialStatus } from "@/services/plannerCredentials";
import { PendingInvitesSection } from "@/components/planner/PendingInvitesSection";
import { PlannerInvitedSection } from "@/components/planner/PlannerInvitedSection";
import { PlannerStageGroupSection } from "@/components/planner/PlannerStageGroupSection";
import { getChatUnreadCount } from "@/services/chat";

const STAGE_GROUPS = [
  { key: "site-proposed", label: "Site Proposed", stages: ["Site proposed"] },
  { key: "under-consideration", label: "Under Consideration", stages: ["Under consideration"] },
  { key: "approved", label: "Approved", stages: ["Approved"] },
  { key: "deployed-stages", label: "Deployed Stages", stages: ["OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"] },
];

const PLANNER_LIST_NAV_ITEMS: SidebarItem[] = [
  { key: "invitations", label: "Invitations", icon: "mail" },
  { key: "planner-invited", label: "Planner Invited", icon: "person_add" },
  { key: "site-proposed", label: "Site Proposed", icon: "location_searching" },
  { key: "under-consideration", label: "Under Consideration", icon: "fact_check" },
  { key: "approved", label: "Approved", icon: "verified" },
  { key: "deployed-stages", label: "Deployed Stages", icon: "rocket_launch" },
  { key: "chat", label: "Chat", icon: "chat", href: "/chat" },
];

const VALID_SECTIONS = [
  "invitations",
  "planner-invited",
  "site-proposed",
  "under-consideration",
  "approved",
  "deployed-stages",
] as const;

type PlannerSection = (typeof VALID_SECTIONS)[number];

function PlannerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<PlannerProject[]>([]);
  const [invites, setInvites] = useState<PlannerPendingInvite[]>([]);
  const [credStatus, setCredStatus] = useState<CredentialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const isSubmittingRef = useRef(false);

  const rawSection = searchParams.get("section");
  const activeSection: PlannerSection = VALID_SECTIONS.includes(rawSection as PlannerSection)
    ? (rawSection as PlannerSection)
    : "invitations";

  const isPlanner = user?.role === "Urban Planner";

  const loadData = useCallback(() => {
    Promise.all([getPendingInvites(), getPlannerProjects(), getPlannerCredentials().catch(() => null)])
      .then(([invList, projList, credRes]) => {
        setInvites(invList);
        setProjects(projList.filter((p) => p.stage !== "Draft"));
        if (credRes) setCredStatus(credRes.status);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load planner data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await getChatUnreadCount();
        if (isMounted) setChatUnreadCount(res.unread_count ?? 0);
      } catch {
        // tolerate errors silently without red banners
      }
    };
    void fetchUnread();
    const interval = setInterval(() => { void fetchUnread(); }, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

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
    loadData();
  }, [isReady, isAuthenticated, isPlanner, router, loadData]);

  async function handleAccept(projectId: number) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setActionLoadingId(projectId);
    try {
      setError("");
      await acceptInvite(projectId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite.");
    } finally {
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
      loadData();
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

  const currentStageGroup = STAGE_GROUPS.find((g) => g.key === activeSection);
  const plannerInvitedProjects = projects.filter(
    (p) => p.stage === "Planner invited" && p.planner_id === user?.id
  );
  const plannerInvitedCount = plannerInvitedProjects.length;
  const siteProposedCount = projects.filter(
    (p) => p.stage === "Site proposed" || (p.stage === "OpenForResponse" && Boolean(p.site_change_status))
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />

      {credStatus && credStatus !== "Verified" && (
        <div className="px-[16px] md:px-[24px] pt-[16px]">
          <div id="planner-credentials-banner" className="flex flex-wrap items-center justify-between gap-[12px] rounded-xl border border-primary/40 bg-primary/10 p-[16px] text-primary">
            <div className="flex items-center gap-[10px]">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
              <div>
                <p className="font-sans text-[14px] font-semibold text-white">
                  Submit your credentials to be listed for invitations
                </p>
                <p className="mt-[2px] text-[12px] text-on-surface-variant">
                  {credStatus === "Pending"
                    ? "Your submission is currently pending administrator verification."
                    : credStatus === "Rejected"
                    ? "Your credential submission was rejected. Please review feedback on your profile and resubmit."
                    : "Unverified planners are not visible in government planner searches."}
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-[6px] rounded border border-primary bg-primary px-[14px] py-[7px] font-data-mono text-[11px] font-bold text-surface-container-lowest uppercase tracking-wider hover:opacity-90"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 w-full">
        <SidebarLayout
          items={PLANNER_LIST_NAV_ITEMS.map((item) => {
            if (item.key === "chat") return { ...item, badge: chatUnreadCount };
            if (item.key === "planner-invited") return { ...item, badge: plannerInvitedCount };
            if (item.key === "site-proposed") return { ...item, badge: siteProposedCount };
            return item;
          })}
          activeKey={activeSection}
          basePath="/planner"
          navTitle="Planner stages"
          idPrefix="planner"
        >
          <header className="flex flex-wrap items-end justify-between gap-[16px] border-b border-white/10 pb-[24px]">
            <div>
              <p className="font-label-caps text-label-caps tracking-widest text-primary">
                URBAN PLANNING PORTAL
              </p>
              <h1 className="mt-[8px] font-display-md text-display-md">Planner Dashboard</h1>
              <p className="mt-[8px] text-sm text-on-surface-variant">
                Manage invitations, site proposals, and deploy approvals.
              </p>
            </div>
          </header>

          {error && <p className="mt-[20px] font-data-mono text-sm text-danger">{error}</p>}

          <div className="mt-[32px]">
            {activeSection === "invitations" && (
              <PendingInvitesSection
                invites={invites}
                loading={loading}
                actionLoadingId={actionLoadingId}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            )}

            {activeSection === "planner-invited" && (
              <PlannerInvitedSection
                projects={plannerInvitedProjects}
                loading={loading}
              />
            )}

            {currentStageGroup && (
              <PlannerStageGroupSection
                group={currentStageGroup}
                projects={projects}
                loading={loading}
              />
            )}
          </div>
        </SidebarLayout>
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
