"use client";

import { useRef } from "react";
import { AdminUser, userRoles } from "@/services/admin";

type AdminUserTableProps = {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  search: string;
  roleFilter: string;
  statusFilter: string;
  currentUserId: number | undefined;
  loading: boolean;
  onSearchChange: (val: string) => void;
  onRoleFilterChange: (val: string) => void;
  onStatusFilterChange: (val: string) => void;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onOpenConfirm: (user: AdminUser, action: "deactivate" | "reactivate") => void;
  onStatusChange: (userId: number, isActive: boolean) => void;
};

export function AdminUserTable({
  users,
  total,
  page,
  limit,
  search,
  roleFilter,
  statusFilter,
  currentUserId,
  loading,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onPageChange,
  onLimitChange,
  onOpenConfirm,
  onStatusChange,
}: AdminUserTableProps) {
  const pageNavRef = useRef(false);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function handlePageNav(delta: number) {
    if (pageNavRef.current) return;
    const target = page + delta;
    if (target < 1 || target > totalPages) return;
    pageNavRef.current = true;
    onPageChange(target);
    setTimeout(() => { pageNavRef.current = false; }, 200);
  }

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(total, page * limit);

  return (
    <div className="glass-card rounded-[20px] p-[24px] border border-white/10 mt-[24px]">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-[16px] pb-[20px] border-b border-white/10">
        <div className="flex flex-wrap items-center gap-[12px] flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-[12px] top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/60" aria-hidden="true">
              search
            </span>
            <input
              id="search-users-input"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, email, city..."
              className="w-full h-[38px] pl-[38px] pr-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="w-[160px]">
            <select
              id="role-filter-select"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              aria-label="Filter users by role"
              className="w-full h-[38px] px-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] focus:outline-none focus:border-primary"
            >
              <option value="">All Roles</option>
              {userRoles.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>

          <div className="w-[140px]">
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              aria-label="Filter users by status"
              className="w-full h-[38px] px-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] focus:outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-[8px] text-[12px] font-data-mono text-on-surface-variant">
          <span>Show:</span>
          <select
            id="page-size-select"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-[32px] px-[8px] rounded-[6px] bg-surface-muted/60 border border-white/15 text-foreground focus:outline-none focus:border-primary text-[12px]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto mt-[16px]">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-data-mono uppercase tracking-wider text-on-surface-variant">
              <th className="py-[12px] px-[8px] xl:px-[12px] max-w-[220px]">User</th>
              <th className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">Email</th>
              <th className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">Role</th>
              <th className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">City</th>
              <th className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">Status</th>
              <th className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">Created</th>
              <th className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">Last Login</th>
              <th className="py-[12px] px-[8px] xl:px-[12px] text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-[13px]">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-[32px] text-center text-on-surface-variant font-data-mono text-[12px]">
                  LOADING USER REGISTRY…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-[32px] text-center text-on-surface-variant font-data-mono text-[12px]">
                  No matching user accounts found.
                </td>
              </tr>
            ) : (
              users.map((item) => {
                const isSelf = currentUserId === item.id;
                const displayName = item.name || item.full_name;
                const isFlaggedInactive = Boolean(item.is_inactive || item.inactive_flag);

                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Column 0: Full Name & ID */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] max-w-[220px] break-words">
                      <div className="flex items-center gap-[6px] flex-wrap">
                        <span className="font-semibold text-foreground break-words">{displayName}</span>
                        {isSelf && (
                          <span className="px-[6px] py-[1px] rounded text-[10px] font-data-mono border border-primary/40 bg-primary/10 text-primary whitespace-nowrap">
                            YOU
                          </span>
                        )}
                        {item.is_demo && (
                          <span className="px-[6px] py-[1px] rounded text-[10px] font-data-mono border border-white/20 bg-white/5 text-on-surface-variant whitespace-nowrap">
                            DEMO
                          </span>
                        )}
                        {isFlaggedInactive && (
                          <span
                            data-testid="inactive-20-badge"
                            className="px-[6px] py-[1px] rounded text-[10px] font-data-mono border border-cyan-400/30 bg-cyan-950/40 text-cyan-300 font-medium whitespace-nowrap"
                          >
                            Inactive 20+ days
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-data-mono text-on-surface-variant/70">ID: #{item.id}</span>
                    </td>

                    {/* Column 1: Email (Matches test_j5 td[1]) */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] font-data-mono text-[12px] text-foreground whitespace-nowrap">
                      {item.email}
                    </td>

                    {/* Column 2: Role */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">
                      <span className="inline-block whitespace-nowrap px-[8px] py-[2px] rounded-[6px] bg-surface-muted/60 border border-white/10 text-[12px] font-sans font-medium text-foreground">
                        {item.role}
                      </span>
                    </td>

                    {/* Column 3: City */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] font-data-mono text-[12px] text-on-surface-variant capitalize whitespace-nowrap">
                      {item.city || "—"}
                    </td>

                    {/* Column 4: Status (Matches test_j4 input aria-label) */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] whitespace-nowrap">
                      <div className="flex items-center gap-[8px] whitespace-nowrap">
                        <input
                          type="checkbox"
                          aria-label={`Active status for ${displayName}`}
                          checked={item.is_active}
                          disabled={isSelf}
                          onChange={(e) => onStatusChange(item.id, e.target.checked)}
                          className="h-[16px] w-[16px] accent-primary rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        />
                        <span className={`inline-block whitespace-nowrap px-[8px] py-[2px] rounded-full text-[10px] font-data-mono font-medium ${
                          item.is_active
                            ? "bg-success/10 text-success border border-success/30"
                            : "bg-danger/10 text-danger border border-danger/30"
                        }`}>
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* Column 5: Created Date */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] font-data-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {item.created_at ? item.created_at.slice(0, 10) : "—"}
                    </td>

                    {/* Column 6: Last Login */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] font-data-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {item.last_login_at ? item.last_login_at.slice(0, 10) : "Never"}
                    </td>

                    {/* Column 7: Actions */}
                    <td className="py-[12px] px-[8px] xl:px-[12px] text-right whitespace-nowrap">
                      {isSelf ? (
                        <span className="text-[11px] font-data-mono text-on-surface-variant/50 italic">Protected</span>
                      ) : item.is_active ? (
                        <button
                          type="button"
                          id={`deactivate-user-${item.id}-btn`}
                          onClick={() => onOpenConfirm(item, "deactivate")}
                          className="inline-flex items-center justify-center whitespace-nowrap h-[28px] px-[10px] rounded-[6px] border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 font-data-mono text-[11px] font-medium transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`reactivate-user-${item.id}-btn`}
                          onClick={() => onOpenConfirm(item, "reactivate")}
                          className="inline-flex items-center justify-center whitespace-nowrap h-[28px] px-[10px] rounded-[6px] border border-success/40 bg-success/10 text-success hover:bg-success/20 font-data-mono text-[11px] font-medium transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-[16px] pt-[16px] mt-[12px] border-t border-white/10 text-[12px] font-data-mono text-on-surface-variant">
        <div>Showing {startIdx}–{endIdx} of {total} accounts</div>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            id="prev-page-btn"
            onClick={() => handlePageNav(-1)}
            disabled={page <= 1 || loading}
            className="h-[32px] px-[12px] rounded-[6px] border border-white/15 bg-white/5 hover:bg-white/10 text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            id="next-page-btn"
            onClick={() => handlePageNav(1)}
            disabled={page >= totalPages || loading}
            className="h-[32px] px-[12px] rounded-[6px] border border-white/15 bg-white/5 hover:bg-white/10 text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
