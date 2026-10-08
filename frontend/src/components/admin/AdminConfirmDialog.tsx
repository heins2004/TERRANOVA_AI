"use client";

import { useRef, useState } from "react";
import { AdminUser } from "@/services/admin";

type AdminConfirmDialogProps = {
  isOpen: boolean;
  targetUser: AdminUser | null;
  action: "deactivate" | "reactivate" | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminConfirmDialog({
  isOpen,
  targetUser,
  action,
  onClose,
  onConfirm,
}: AdminConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isSubmittingRef = useRef(false);

  if (!isOpen || !targetUser || !action) return null;

  const isDeactivate = action === "deactivate";

  async function handleConfirm() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute action.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/75 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-[20px] p-[24px] border border-white/15 bg-surface/95 shadow-2xl">
        <div className="flex items-center gap-[12px] mb-[16px]">
          <span
            className={`material-symbols-outlined text-[24px] p-[8px] rounded-full ${
              isDeactivate ? "bg-danger/10 text-danger border border-danger/30" : "bg-success/10 text-success border border-success/30"
            }`}
          >
            {isDeactivate ? "person_off" : "person_check"}
          </span>
          <div>
            <h3 className="font-display-md text-[18px] font-bold text-foreground">
              {isDeactivate ? "Confirm Deactivation" : "Confirm Reactivation"}
            </h3>
            <span className="font-data-mono text-[11px] text-on-surface-variant">User ID: #{targetUser.id}</span>
          </div>
        </div>

        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          {isDeactivate ? (
            <>
              Are you sure you want to deactivate <strong className="text-foreground">{targetUser.name || targetUser.full_name}</strong> (
              <span className="font-data-mono text-primary">{targetUser.email}</span>)?
              <br />
              <span className="mt-[8px] block text-[12px] text-danger/90 font-data-mono">
                Their existing sessions will stop immediately, preventing further login. Their comments and projects will stay.
              </span>
            </>
          ) : (
            <>
              Are you sure you want to reactivate <strong className="text-foreground">{targetUser.name || targetUser.full_name}</strong> (
              <span className="font-data-mono text-primary">{targetUser.email}</span>)?
              <br />
              <span className="mt-[8px] block text-[12px] text-success/90 font-data-mono">
                The account will immediately be permitted to log in again.
              </span>
            </>
          )}
        </p>

        {error && (
          <div
            id="admin-confirm-error"
            className="mt-[12px] p-[10px] rounded-[8px] bg-danger/10 border border-danger/30 text-danger text-[11px] font-data-mono flex items-center gap-[6px]"
          >
            <span className="material-symbols-outlined text-[14px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="mt-[20px] pt-[16px] flex items-center justify-end gap-[12px] border-t border-white/10">
          <button
            type="button"
            id="cancel-confirm-action-btn"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[36px] px-[16px] rounded-[8px] border border-white/15 bg-white/5 text-on-surface-variant hover:text-foreground font-data-mono text-[12px] tracking-wider uppercase transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-action-btn"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className={`h-[36px] px-[20px] rounded-[8px] font-data-mono text-[12px] font-semibold tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDeactivate
                ? "border border-danger/60 bg-danger/20 text-danger hover:bg-danger/30 shadow-[0_0_15px_rgba(248,113,113,0.25)]"
                : "border border-success/60 bg-success/20 text-success hover:bg-success/30 shadow-[0_0_15px_rgba(52,211,153,0.25)]"
            }`}
          >
            {isSubmitting
              ? "Processing..."
              : isDeactivate
              ? "Deactivate Account"
              : "Reactivate Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
