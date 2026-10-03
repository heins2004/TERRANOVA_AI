"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { AdminUser, getUsers, updateUserRole, updateUserStatus, userRoles, UserRole } from "@/services/admin";

export default function AdminPage() {
  const { user, isReady } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const isAdministrator = user?.role === "Administrator";

  useEffect(() => {
    if (!isReady || !isAdministrator) return;
    getUsers()
      .then(setUsers)
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Unable to load users.")
      );
  }, [isAdministrator, isReady]);

  function replaceUser(updated: AdminUser) {
    setUsers((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  async function changeRole(id: number, role: UserRole) {
    try {
      setError("");
      setUpdatingId(id);
      replaceUser(await updateUserRole(id, role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the user role.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function changeStatus(id: number, is_active: boolean) {
    try {
      setError("");
      setUpdatingId(id);
      replaceUser(await updateUserStatus(id, is_active));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the user status.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!isReady)
    return (
      <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
        <TopBar user={user} />
        <main className="flex-1 px-[24px] py-[32px]">
          <p className="mx-auto max-w-6xl font-data-mono text-sm text-on-surface-variant">
            LOADING USER MANAGEMENT…
          </p>
        </main>
      </div>
    );

  if (!isAdministrator)
    return (
      <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
        <TopBar user={user} />
        <main className="flex-1 px-[24px] py-[32px]">
          <section className="glass-card mx-auto max-w-2xl rounded-[24px] p-[32px]">
            <p className="font-label-caps text-label-caps tracking-widest text-danger">
              ACCESS DENIED
            </p>
            <h1 className="mt-[12px] font-display-md text-display-md">
              Administrator access is required.
            </h1>
            <p className="mt-[12px] text-sm text-on-surface-variant">
              You do not have permission to manage user accounts.
            </p>
          </section>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />
      <main className="flex-1 px-[24px] py-[32px]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-[16px]">
            <div>
              <p className="font-label-caps text-label-caps tracking-widest text-primary">
                ADMINISTRATION
              </p>
              <h1 className="mt-[8px] font-display-md text-display-md">User Management</h1>
              <p className="mt-[8px] text-sm text-on-surface-variant">
                Manage account roles and access status.
              </p>
            </div>
          </div>
          {error && <p className="mt-[24px] text-danger">{error}</p>}
          <section className="glass-card mt-[24px] overflow-x-auto rounded-[24px] p-[24px]">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-border text-on-surface-variant">
                <tr>
                  <th className="px-[12px] py-[12px] font-medium">Name</th>
                  <th className="px-[12px] py-[12px] font-medium">Email</th>
                  <th className="px-[12px] py-[12px] font-medium">Role</th>
                  <th className="px-[12px] py-[12px] font-medium">Status</th>
                  <th className="px-[12px] py-[12px] font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => {
                  const isSelf = account.id === user?.id;
                  const isUpdating = updatingId === account.id;
                  return (
                    <tr
                      className="border-b border-border/70 last:border-0"
                      key={account.id}
                    >
                      <td className="px-[12px] py-[16px] font-medium">
                        {account.full_name}
                      </td>
                      <td className="px-[12px] py-[16px] text-on-surface-variant">
                        {account.email}
                      </td>
                      <td className="px-[12px] py-[16px]">
                        <select
                          aria-label={`Role for ${account.full_name}`}
                          className="rounded-[8px] border border-border bg-surface px-[10px] py-[8px] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSelf || isUpdating}
                          onChange={(event) =>
                            void changeRole(account.id, event.target.value as UserRole)
                          }
                          value={account.role}
                        >
                          {userRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-[12px] py-[16px]">
                        <label className="inline-flex items-center gap-[8px]">
                          <input
                            aria-label={`Active status for ${account.full_name}`}
                            checked={account.is_active}
                            disabled={isSelf || isUpdating}
                            onChange={(event) =>
                              void changeStatus(account.id, event.target.checked)
                            }
                            type="checkbox"
                          />
                          <span
                            className={account.is_active ? "text-primary" : "text-danger"}
                          >
                            {account.is_active ? "Active" : "Inactive"}
                          </span>
                        </label>
                      </td>
                      <td className="px-[12px] py-[16px] text-on-surface-variant">
                        {new Date(account.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!error && !users.length && (
              <p className="py-[24px] font-data-mono text-sm text-on-surface-variant">
                NO USERS FOUND.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
