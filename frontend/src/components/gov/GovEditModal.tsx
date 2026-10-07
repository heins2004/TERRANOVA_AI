"use client";

import { useRef, useState } from "react";
import { GovProject, updateGovProject } from "@/services/gov";

interface GovEditModalProps {
  project: GovProject;
  onClose: () => void;
  onSuccess: () => void;
}

export function GovEditModal({ project, onClose, onSuccess }: GovEditModalProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [budget, setBudget] = useState(project.budget != null ? String(project.budget) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      await updateGovProject(project.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[16px] border border-white/15 bg-[#0a0e17] p-[24px] shadow-2xl space-y-[16px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
          <h3 className="font-sans text-[18px] font-semibold text-white">
            {project.stage === "Approved" ? "Final Edit (Approved Stage)" : "Edit Project (Draft)"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="rounded border border-danger/40 bg-danger/10 p-[12px] text-danger text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-[16px]">
          <div>
            <label className="block text-sm font-medium text-white">Project Title</label>
            <input
              type="text"
              id="gov-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Description</label>
            <textarea
              rows={3}
              id="gov-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Budget (₹ INR)</label>
            <input
              type="number"
              id="gov-edit-budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-[12px] pt-[8px]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded border border-white/15 px-[14px] py-[8px] font-data-mono text-[12px] text-on-surface-variant uppercase hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="gov-edit-save-btn"
              disabled={submitting}
              className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase transition-all hover:bg-primary-container/30 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
