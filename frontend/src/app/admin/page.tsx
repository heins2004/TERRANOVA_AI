"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarItem, SidebarLayout } from "@/components/layout/SidebarLayout";
import {
  AdminStats,
  AdminUser,
  getAdminStats,
  getUsers,
  deactivateUser,
  reactivateUser,
  updateUserStatus,
} from "@/services/admin";
import { AdminOverviewSection } from "@/components/admin/AdminOverviewSection";
import { AdminAnalyticsTabSection } from "@/components/admin/AdminAnalyticsTabSection";
import { AdminVerificationTabSection } from "@/components/admin/AdminVerificationTabSection";
import { AdminLoginLogTabSection } from "@/components/admin/AdminLoginLogTabSection";
import { AdminUsersSection } from "@/components/admin/AdminUsersSection";
import { CreateOfficialModal } from "@/components/admin/CreateOfficialModal";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";

const ADMIN_NAV_ITEMS: SidebarItem[] = [
  { key: "overview", label: "Overview", icon: "dashboard" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "users", label: "Users", icon: "group" },
  { key: "verification", label: "Planner verification", icon: "verified_user" },
  { key: "login-log", label: "Login log", icon: "history" },
];

const VALID_SECTIONS = [
  "overview",
  "analytics",
  "users",
  "verification",
  "login-log",
] as const;

type AdminSection = (typeof VALID_SECTIONS)[number];

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady, isAuthenticated } = useAuth();
  const isAdministrator = user?.role === "Administrator";

  const rawSection = searchParams.get("section");
  const activeSection: AdminSection = VALID_SECTIONS.includes(rawSection as AdminSection)
    ? (rawSection as AdminSection)
    : "overview";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    targetUser: AdminUser | null;
    action: "deactivate" | "reactivate" | null;
  }>({ isOpen: false, targetUser: null, action: null });

  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isAdministrator) {
      const timer = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timer);
    }
  }, [isReady, isAuthenticated, isAdministrator, router]);

  useEffect(() => {
    if (!isReady || !isAdministrator) return;
    let active = true;

    getAdminStats()
      .then((data) => { if (active) setStats(data); })
      .catch(() => {})
      .finally(() => { if (active) setStatsLoading(false); });

    getUsers({
      q: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      limit,
      offset: (page - 1) * limit,
    })
      .then((res) => {
        if (active) {
          setUsers(res);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            message: err instanceof Error ? err.message : "Failed to load user accounts.",
            type: "error",
          });
        }
      })
      .finally(() => { if (active) setUsersLoading(false); });

    return () => { active = false; };
  }, [isReady, isAdministrator, search, roleFilter, statusFilter, page, limit, reloadKey]);

  const createBtnRef = useRef(false);
  function handleOpenCreateModal() {
    if (createBtnRef.current) return;
    createBtnRef.current = true;
    setIsCreateModalOpen(true);
    setTimeout(() => { createBtnRef.current = false; }, 200);
  }

  function handleOfficialCreated(newOfficial: AdminUser) {
    setFeedback({ message: `Official account created for ${newOfficial.email}.`, type: "success" });
    setReloadKey((k) => k + 1);
  }

  async function handleExecuteConfirmAction() {
    if (!confirmDialog.targetUser || !confirmDialog.action) return;
    const { targetUser: target, action } = confirmDialog;

    if (action === "deactivate") {
      const updated = await deactivateUser(target.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setFeedback({ message: `User ${target.email} has been deactivated.`, type: "success" });
    } else {
      const updated = await reactivateUser(target.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setFeedback({ message: `User ${target.email} has been reactivated.`, type: "success" });
    }
    setReloadKey((k) => k + 1);
  }

  async function handleStatusChange(userId: number, isActive: boolean) {
    try {
      const updated = await updateUserStatus(userId, isActive);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setFeedback({
        message: `User #${userId} status set to ${isActive ? "Active" : "Inactive"}`,
        type: "success",
      });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Failed to toggle status.",
        type: "error",
      });
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
        <TopBar user={user} />
        <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
          <p className="font-data-mono text-sm text-on-surface-variant">LOADING USER MANAGEMENT…</p>
        </main>
      </div>
    );
  }

  if (!isAdministrator) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
        <TopBar user={user} />
        <main className="flex-1 px-[24px] py-[32px]">
          <section className="glass-card mx-auto max-w-2xl rounded-[24px] p-[32px]">
            <p className="font-data-mono text-[11px] font-semibold tracking-widest text-danger uppercase">ACCESS DENIED</p>
            <h1 className="mt-[12px] font-display-md text-2xl font-bold">Administrator access is required.</h1>
            <p className="mt-[12px] text-sm text-on-surface-variant">You do not have permission to manage user accounts. Redirecting...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />
      <main className="flex-1 px-[16px] sm:px-[24px] py-[32px]">
        <div className="mx-auto max-w-7xl">
          <SidebarLayout items={ADMIN_NAV_ITEMS} activeKey={activeSection}>
            {activeSection === "overview" && <AdminOverviewSection stats={stats} loading={statsLoading} />}
            {activeSection === "analytics" && <AdminAnalyticsTabSection />}
            {activeSection === "users" && (
              <AdminUsersSection
                users={users}
                total={total}
                page={page}
                limit={limit}
                search={search}
                roleFilter={roleFilter}
                statusFilter={statusFilter}
                currentUserId={user?.id}
                loading={usersLoading}
                feedback={feedback}
                onClearFeedback={() => setFeedback(null)}
                onOpenCreateModal={handleOpenCreateModal}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                onRoleFilterChange={(val) => { setRoleFilter(val); setPage(1); }}
                onStatusFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
                onPageChange={setPage}
                onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
                onOpenConfirm={(target, action) => setConfirmDialog({ isOpen: true, targetUser: target, action })}
                onStatusChange={handleStatusChange}
              />
            )}
            {activeSection === "verification" && <AdminVerificationTabSection />}
            {activeSection === "login-log" && <AdminLoginLogTabSection />}
          </SidebarLayout>
        </div>
      </main>

      <CreateOfficialModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleOfficialCreated}
      />

      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        targetUser={confirmDialog.targetUser}
        action={confirmDialog.action}
        onClose={() => setConfirmDialog({ isOpen: false, targetUser: null, action: null })}
        onConfirm={handleExecuteConfirmAction}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
          <TopBar />
          <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
            <p className="font-data-mono text-sm text-on-surface-variant">LOADING USER MANAGEMENT…</p>
          </main>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
