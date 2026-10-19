"use client";

import React, { useState } from "react";
import { ProjectConsultation, cancelProjectConsultation } from "@/services/projectConsultations";

interface CancelModalProps {
  projectId: number;
  consultation: ProjectConsultation;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function GovConsultationCancelModal({
  projectId,
  consultation,
  onClose,
  onSuccess,
}: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10 || reason.trim().length > 500) {
      setError("Cancel reason must be between 10 and 500 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await cancelProjectConsultation(projectId, consultation.id, reason.trim());
      onSuccess("Consultation cancelled successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm">
      <div className="w-full max-w-[480px] rounded-[16px] border border-red-800/40 bg-surface-container-lowest p-[24px] shadow-2xl">
        <h3 className="font-sans text-lg font-bold text-red-400">Cancel Consultation #{consultation.id}</h3>
        <p className="mt-[6px] text-xs text-on-surface-variant">Please provide the reason for cancellation (10-500 characters). This will be displayed publicly or to invited attendees.</p>
        <form onSubmit={handleCancel} className="mt-[14px] space-y-[12px]">
          <textarea id="cancel-reason-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for cancellation..." className="w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-red-400 focus:outline-none" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-[10px] pt-[6px]">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded border border-white/20 px-[14px] py-[6px] text-xs text-white hover:bg-white/10">Back</button>
            <button id="confirm-cancel-btn" type="submit" disabled={isSubmitting} className="rounded bg-red-700 px-[16px] py-[6px] text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">{isSubmitting ? "Cancelling..." : "Confirm Cancellation"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
