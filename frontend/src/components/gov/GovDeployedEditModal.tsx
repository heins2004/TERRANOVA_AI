"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GovProject, updateDeployedProjectDetails, DeployedProjectEditPayload } from "@/services/gov";
import { getKolkataToday, isDateInPast, isEndAfterStart, isStartDateAfterDeadline } from "@/lib/dateRules";
import { DateTimeInput } from "@/components/common/DateTimeInput";

interface GovDeployedEditModalProps {
  project: GovProject;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function GovDeployedEditModal({
  project,
  onClose,
  onSuccess,
}: GovDeployedEditModalProps) {
  const initialStartDate = project.start_date || "";
  const initialEndDate = project.end_date || "";

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [category, setCategory] = useState(project.category ?? "");
  const [budget, setBudget] = useState(project.budget != null ? String(project.budget) : "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const startDateChanged = startDate !== initialStartDate;
  const endDateChanged = endDate !== initialEndDate;

  let startDateInlineError = "";
  if (startDateChanged && startDate) {
    if (isDateInPast(startDate)) {
      startDateInlineError = "Start date must be today or in the future.";
    } else if (
      project.response_deadline &&
      !isStartDateAfterDeadline(startDate, project.response_deadline)
    ) {
      startDateInlineError = "Start date must be later than the response deadline.";
    }
  }

  let endDateInlineError = "";
  if ((startDateChanged || endDateChanged) && startDate && endDate) {
    if (!isEndAfterStart(startDate, endDate)) {
      endDateInlineError = "End date must be after start date.";
    }
  }

  const isDateBlocked = Boolean(startDateInlineError || endDateInlineError);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    if (startDateInlineError) {
      setError(startDateInlineError);
      return;
    }

    if (endDateInlineError) {
      setError(endDateInlineError);
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const payload: DeployedProjectEditPayload = {};

      if (title.trim() !== project.title) {
        payload.title = title.trim();
      }
      if (description.trim() !== (project.description ?? "")) {
        payload.description = description.trim();
      }
      if (category.trim() !== (project.category ?? "")) {
        payload.category = category.trim();
      }
      if (budget !== (project.budget != null ? String(project.budget) : "")) {
        payload.budget = budget ? Number(budget) : undefined;
      }
      if (startDateChanged) {
        payload.start_date = startDate || undefined;
      }
      if (endDateChanged) {
        payload.end_date = endDate || undefined;
      }

      await updateDeployedProjectDetails(project.id, payload);
      onSuccess("Project details updated successfully.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gov-deployed-edit-modal-title"
      className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[16px] border border-white/15 bg-[#0a0e17] p-[24px] shadow-2xl space-y-[16px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
          <h3
            id="gov-deployed-edit-modal-title"
            className="font-sans text-[18px] font-semibold text-white"
          >
            Edit Project Details (Open for Response)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div
            id="gov-deployed-edit-error"
            className="rounded border border-danger/40 bg-danger/10 p-[12px] text-danger text-sm font-data-mono"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-[16px]">
          <div>
            <label htmlFor="gov-deployed-edit-title" className="block text-sm font-medium text-white">
              Project Title *
            </label>
            <input
              type="text"
              id="gov-deployed-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="gov-deployed-edit-desc" className="block text-sm font-medium text-white">
              Description
            </label>
            <textarea
              rows={3}
              id="gov-deployed-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid gap-[16px] sm:grid-cols-2">
            <div>
              <label htmlFor="gov-deployed-edit-category" className="block text-sm font-medium text-white">
                Category
              </label>
              <input
                type="text"
                id="gov-deployed-edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="gov-deployed-edit-budget" className="block text-sm font-medium text-white">
                Budget (₹ INR)
              </label>
              <input
                type="number"
                id="gov-deployed-edit-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Read-only City & Site with clear note */}
          <div className="rounded-[10px] border border-white/10 bg-white/5 p-[14px] space-y-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-[8px]">
              <span className="font-data-mono text-xs uppercase text-on-surface-variant">
                City & Site Location
              </span>
              <span className="rounded bg-white/10 px-[8px] py-[2px] font-data-mono text-[10px] text-on-surface-variant">
                Locked
              </span>
            </div>
            <div className="grid gap-[12px] sm:grid-cols-2 font-data-mono text-xs">
              <div>
                <span className="text-on-surface-variant block">City:</span>
                <span className="text-white font-medium">
                  {project.city_name || project.city || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Site:</span>
                <span className="text-white font-medium">
                  {project.proposed_site_name ||
                    (project.location_lat != null && project.location_lng != null
                      ? `${project.location_lat.toFixed(4)}° N, ${project.location_lng.toFixed(4)}° E`
                      : "Coordinates pending")}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant/70 italic">
              To change city or site area, use Request site change.
            </p>
          </div>

          <div className="grid gap-[16px] sm:grid-cols-2">
            <DateTimeInput
              id="gov-deployed-edit-start-date"
              label="Start Date"
              min={startDateChanged ? getKolkataToday() : undefined}
              value={startDate}
              onChange={setStartDate}
              error={startDateInlineError}
              errorId="gov-deployed-edit-start-date-error"
            />

            <DateTimeInput
              id="gov-deployed-edit-end-date"
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              error={endDateInlineError}
              errorId="gov-deployed-edit-end-date-error"
            />
          </div>

          <div className="flex justify-end gap-[12px] pt-[8px]">
            <button
              type="button"
              id="gov-deployed-edit-cancel-btn"
              onClick={onClose}
              disabled={submitting}
              className="rounded border border-white/15 px-[14px] py-[8px] font-data-mono text-[12px] text-on-surface-variant uppercase hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="gov-deployed-edit-save-btn"
              disabled={submitting || isDateBlocked}
              className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase transition-all hover:bg-primary-container/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
