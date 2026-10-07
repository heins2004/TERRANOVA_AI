"use client";

import { useState } from "react";

interface GovReasonModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function GovReasonModal({ title, onClose, onSubmit }: GovReasonModalProps) {
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reasonText.trim();
    if (trimmed.length < 10 || trimmed.length > 500) {
      setError("Reason must be between 10 and 500 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[16px] border border-white/15 bg-[#0a0e17] p-[24px] shadow-2xl space-y-[16px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
          <h3 className="font-sans text-[17px] font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="rounded border border-danger/40 bg-danger/10 p-[10px] text-danger text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-[12px]">
          <div>
            <label className="block text-xs font-data-mono text-on-surface-variant uppercase">
              Operational Rationale (10 to 500 characters)
            </label>
            <textarea
              id="gov-reason-textarea"
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Provide explicit operational rationale..."
              className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 p-[10px] text-sm text-white focus:border-primary focus:outline-none"
            />
            <span className="font-data-mono text-[10px] text-on-surface-variant">
              {reasonText.trim().length}/500 chars (min 10)
            </span>
          </div>

          <div className="flex justify-end gap-[12px]">
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
              id="gov-reason-submit-btn"
              disabled={submitting || reasonText.trim().length < 10 || reasonText.trim().length > 500}
              className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
