"use client";

import { useEffect, useRef, useState } from "react";
import { extendDeadline, GovProject } from "@/services/gov";

interface GovExtendDeadlineModalProps {
  project: GovProject;
  onClose: () => void;
  onSuccess: () => void;
}

export function GovExtendDeadlineModal({
  project,
  onClose,
  onSuccess,
}: GovExtendDeadlineModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const [newDate, setNewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

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

  const formattedCurrentDeadline = project.response_deadline
    ? new Date(project.response_deadline).toLocaleString("en-IN")
    : "Not set";

  async function handleExtendSubmit() {
    if (!newDate) {
      setError("Please select a new response deadline date.");
      return;
    }

    const selectedDateTime = new Date(`${newDate}T23:59:59`);
    const now = new Date();

    if (selectedDateTime.getTime() <= now.getTime()) {
      setError("Extended deadline must be in the future.");
      return;
    }

    if (
      project.response_deadline &&
      selectedDateTime.getTime() <= new Date(project.response_deadline).getTime()
    ) {
      setError("Extended deadline must be strictly later than current deadline.");
      return;
    }

    if (project.start_date) {
      const projectStartDate = new Date(project.start_date);
      if (selectedDateTime.getTime() >= projectStartDate.getTime()) {
        setError("Start date must be after the response deadline. Edit the project start date first.");
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      await extendDeadline(project.id, selectedDateTime.toISOString());
      setSuccessMsg("Response deadline extended successfully.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend deadline.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="extend-deadline-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-[16px] border border-white/15 bg-[#0a0e17] p-[20px] sm:p-[24px] shadow-2xl space-y-[16px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
          <h3
            id="extend-deadline-title"
            className="font-sans text-[17px] font-semibold text-white"
          >
            Extend response deadline
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

        <div className="text-sm text-on-surface-variant">
          <span>Current deadline: </span>
          <strong className="text-white font-medium">{formattedCurrentDeadline}</strong>
        </div>

        <div className="space-y-[6px]">
          <label
            htmlFor="extend-deadline-date-input"
            className="block font-data-mono text-[11px] text-on-surface-variant uppercase"
          >
            New Response Deadline
          </label>
          <input
            id="extend-deadline-date-input"
            type="date"
            min={tomorrow}
            value={newDate}
            onChange={(e) => {
              setNewDate(e.target.value);
              setError("");
            }}
            className="w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded border border-danger/40 bg-danger/10 p-[10px] text-xs text-danger font-data-mono"
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="rounded border border-success/40 bg-success/10 p-[10px] text-xs text-success font-data-mono"
          >
            {successMsg}
          </div>
        )}

        <div className="flex justify-end gap-[12px] pt-[8px]">
          <button
            ref={cancelBtnRef}
            type="button"
            id="extend-modal-cancel-btn"
            onClick={onClose}
            disabled={submitting}
            className="rounded border border-white/15 px-[14px] py-[8px] font-data-mono text-[12px] text-on-surface-variant uppercase hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-extend-deadline-btn"
            onClick={() => void handleExtendSubmit()}
            disabled={submitting || !newDate}
            className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {submitting ? "Extending..." : "Extend deadline"}
          </button>
        </div>
      </div>
    </div>
  );
}
