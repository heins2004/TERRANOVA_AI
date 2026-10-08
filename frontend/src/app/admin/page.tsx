"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import {
  AdminStats,
  AdminUser,
  getAdminStats,
  getUsers,
  deactivateUser,
  reactivateUser,
  updateUserRole,
  updateUserStatus,
  UserRole,
} from "@/services/admin";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { CreateOfficialModal } from "@/components/admin/CreateOfficialModal";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";

export default function AdminPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuth();
  const isAdministrator = user?.role === "Administrator";

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

  // Auth gate effect
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

  // Data fetching effect (promise callbacks avoid synchronous setState)
  useEffect(() => {
    if (!isReady || !isAdministrator) return;
    let active = true;

    getAdminStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setStatsLoading(false);
      });

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
      .finally(() => {
        if (active) setUsersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isReady, isAdministrator, search, roleFilter, statusFilter, page, limit, reloadKey]);

  // Ref guard for open-modal button
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

  async function handleRoleChange(userId: number, role: UserRole) {
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setFeedback({ message: `Updated role for ID #${userId} to ${role}`, type: "success" });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFeedback({ message: err instanceof Error ? err.message : "Failed to change user role.", type: "error" });
    }
  }

  async function handleStatusChange(userId: number, isActive: boolean) {
    try {
      const updated = await updateUserStatus(userId, isActive);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setFeedback({ message: `User #${userId} status set to ${isActive ? "Active" : "Inactive"}`, type: "success" });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFeedback({ message: err instanceof Error ? err.message : "Failed to toggle status.", type: "error" });
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
            <p className="font-data-mono text-[11px] font-semibold tracking-widest text-danger uppercase">
              ACCESS DENIED
            </p>
            <h1 className="mt-[12px] font-display-md text-2xl font-bold">Administrator access is required.</h1>
            <p className="mt-[12px] text-sm text-on-surface-variant">
              You do not have permission to manage user accounts. Redirecting...
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />
      <main className="flex-1 px-[24px] py-[32px]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-[16px]">
            <div>
              <p className="font-data-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
                ADMINISTRATION // CONSOLE
              </p>
              <h1 className="mt-[8px] font-display-md text-display-md font-bold">User Management</h1>
              <p className="mt-[6px] text-sm text-on-surface-variant">
                Manage account roles, deactivate access, provision government officials, and inspect platform aggregates.
              </p>
            </div>

            <button
              type="button"
              id="open-create-official-btn"
              onClick={handleOpenCreateModal}
              className="h-[38px] px-[16px] inline-flex items-center gap-[8px] rounded-[8px] border border-primary/60 bg-primary/15 text-primary hover:bg-primary/25 font-data-mono text-[12px] font-semibold tracking-wider uppercase shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Create Official</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`mt-[20px] p-[12px] rounded-[10px] text-[13px] font-data-mono flex items-center justify-between border ${
                feedback.type === "success"
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-danger/10 border-danger/30 text-danger"
              }`}
            >
              <div className="flex items-center gap-[8px]">
                <span className="material-symbols-outlined text-[18px]">
                  {feedback.type === "success" ? "check_circle" : "error"}
                </span>
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-on-surface-variant hover:text-foreground p-[2px]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          <div className="mt-[24px]">
            <AdminStatsCards stats={stats} loading={statsLoading} />
          </div>

          <AdminUserTable
            users={users}
            total={total}
            page={page}
            limit={limit}
            search={search}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            currentUserId={user?.id}
            loading={usersLoading}
            onSearchChange={(val) => { setSearch(val); setPage(1); }}
            onRoleFilterChange={(val) => { setRoleFilter(val); setPage(1); }}
            onStatusFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
            onOpenConfirm={(target, action) => setConfirmDialog({ isOpen: true, targetUser: target, action })}
            onRoleChange={handleRoleChange}
            onStatusChange={handleStatusChange}
          />
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
