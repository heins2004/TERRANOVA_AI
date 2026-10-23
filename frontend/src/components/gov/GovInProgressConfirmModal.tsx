"use client";

import { useEffect, useRef } from "react";

interface GovInProgressConfirmModalProps {
  deadline: string;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export function GovInProgressConfirmModal({
  deadline,
  onClose,
  onConfirm,
  submitting = false,
}: GovInProgressConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelBtnRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formattedDeadline = new Date(deadline).toLocaleString("en-IN");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-[16px] border border-white/15 bg-[#0a0e17] p-[20px] sm:p-[24px] shadow-2xl space-y-[16px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
          <h3
            id="confirm-modal-title"
            className="font-sans text-[17px] font-semibold text-white"
          >
            Move to In Progress?
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p
          id="confirm-modal-desc"
          className="text-sm leading-relaxed text-on-surface-variant"
        >
          Comments will close for this project. The response period ends on{" "}
          <strong className="text-white font-medium">{formattedDeadline}</strong>.
          Continue?
        </p>

        <div className="flex justify-end gap-[12px] pt-[8px]">
          <button
            ref={cancelBtnRef}
            type="button"
            id="confirm-modal-cancel-btn"
            onClick={onClose}
            disabled={submitting}
            className="rounded border border-white/15 px-[14px] py-[8px] font-data-mono text-[12px] text-on-surface-variant uppercase hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-modal-confirm-btn"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {submitting ? "Moving..." : "Move to In Progress"}
          </button>
        </div>
      </div>
    </div>
  );
}
