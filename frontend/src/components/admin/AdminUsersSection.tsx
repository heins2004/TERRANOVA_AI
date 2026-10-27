"use client";

import React from "react";
import { AdminUser } from "@/services/admin";
import { AdminUserTable } from "./AdminUserTable";

type FeedbackState = {
  message: string;
  type: "success" | "error";
} | null;

type AdminUsersSectionProps = {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  search: string;
  roleFilter: string;
  statusFilter: string;
  currentUserId?: number;
  loading: boolean;
  feedback: FeedbackState;
  onClearFeedback: () => void;
  onOpenCreateModal: () => void;
  onSearchChange: (val: string) => void;
  onRoleFilterChange: (val: string) => void;
  onStatusFilterChange: (val: string) => void;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onOpenConfirm: (target: AdminUser, action: "deactivate" | "reactivate") => void;
  onStatusChange: (userId: number, isActive: boolean) => void;
};

export function AdminUsersSection({
  users,
  total,
  page,
  limit,
  search,
  roleFilter,
  statusFilter,
  currentUserId,
  loading,
  feedback,
  onClearFeedback,
  onOpenCreateModal,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onPageChange,
  onLimitChange,
  onOpenConfirm,
  onStatusChange,
}: AdminUsersSectionProps) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-[16px] mb-[20px]">
        <div>
          <p className="font-data-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
            ADMINISTRATION // USERS
          </p>
          <h1
            id="admin-section-heading"
            className="mt-[6px] font-display-md text-2xl font-bold text-on-surface"
          >
            Users
          </h1>
          <p className="mt-[4px] text-sm text-on-surface-variant">
            Manage account roles, provision government officials, and monitor active account status.
          </p>
        </div>

        <button
          type="button"
          id="open-create-official-btn"
          onClick={onOpenCreateModal}
          className="h-[38px] px-[16px] inline-flex items-center gap-[8px] rounded-[8px] border border-primary/60 bg-primary/15 text-primary hover:bg-primary/25 font-data-mono text-[12px] font-semibold tracking-wider uppercase shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Create account</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-[20px] p-[12px] rounded-[10px] text-[13px] font-data-mono flex items-center justify-between border ${
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
            onClick={onClearFeedback}
            className="text-on-surface-variant hover:text-foreground p-[2px]"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <AdminUserTable
        users={users}
        total={total}
        page={page}
        limit={limit}
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        currentUserId={currentUserId}
        loading={loading}
        onSearchChange={onSearchChange}
        onRoleFilterChange={onRoleFilterChange}
        onStatusFilterChange={onStatusFilterChange}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        onOpenConfirm={onOpenConfirm}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
