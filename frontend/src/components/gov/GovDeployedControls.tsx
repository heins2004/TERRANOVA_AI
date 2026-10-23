"use client";

import { useState } from "react";
import {
  completeProject,
  extendDeadline,
  GovProject,
  startInProgress,
} from "@/services/gov";
import { GovInProgressConfirmModal } from "./GovInProgressConfirmModal";

interface GovDeployedControlsProps {
  project: GovProject;
  loadingAction: string | null;
  onExecute: (name: string, fn: () => Promise<unknown>) => Promise<void>;
  onOpenReason: (action: "halt" | "recall", title: string) => void;
  onError: (err: string) => void;
  extraAction?: React.ReactNode;
}

export function GovDeployedControls({
  project,
  loadingAction,
  onExecute,
  onOpenReason,
  onError,
  extraAction,
}: GovDeployedControlsProps) {
  const [extendDate, setExtendDate] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  function handleMoveToInProgressClick() {
    const isFutureDeadline =
      project.stage === "OpenForResponse" &&
      Boolean(project.response_deadline) &&
      new Date(project.response_deadline!).getTime() > Date.now();

    if (isFutureDeadline) {
      setShowConfirmModal(true);
    } else {
      void onExecute("in_progress", () => startInProgress(project.id));
    }
  }

  return (
    <div className="w-full md:w-auto min-w-0 max-w-full rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[16px] sm:p-[20px] space-y-[16px]">
      <span className="font-data-mono text-[11px] text-primary uppercase">ACTIVE DEPLOYMENT CONTROLS</span>
      {project.stage === "OpenForResponse" && (
        <div className="space-y-[16px]">
          <div className="flex gap-[10px] items-end">
            <div className="flex-1">
              <label className="block font-data-mono text-[11px] text-on-surface-variant uppercase">
                Extend Deadline (Never Shorten)
              </label>
              <input
                type="date"
                id="gov-extend-date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="mt-[4px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="button"
              id="gov-extend-deadline-btn"
              disabled={!extendDate || loadingAction === "extend"}
              onClick={() => {
                if (project.response_deadline && new Date(extendDate) <= new Date(project.response_deadline)) {
                  onError("Extended deadline must be strictly after the current deadline.");
                  return;
                }
                void onExecute("extend", () => extendDeadline(project.id, new Date(extendDate).toISOString()));
              }}
              className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50"
            >
              Extend
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-[10px] pt-[8px] border-t border-white/10">
            <button
              type="button"
              id="gov-in-progress-btn"
              disabled={loadingAction === "in_progress"}
              onClick={handleMoveToInProgressClick}
              className="rounded border border-primary-container bg-primary-container/20 px-[14px] py-[8px] font-data-mono text-[11px] text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50"
            >
              Move to In Progress
            </button>
            <button
              type="button"
              id="gov-halt-btn"
              onClick={() => onOpenReason("halt", "Halt Consultation (Public Reason)")}
              className="rounded border border-warning/40 bg-warning/10 px-[14px] py-[8px] font-data-mono text-[11px] text-warning uppercase hover:bg-warning/20"
            >
              Halt Project
            </button>
            <button
              type="button"
              id="gov-recall-btn"
              onClick={() => onOpenReason("recall", "Recall Project (Public Reason)")}
              className="rounded border border-danger/40 bg-danger/10 px-[14px] py-[8px] font-data-mono text-[11px] text-danger uppercase hover:bg-danger/20"
            >
              Recall Project
            </button>
            {extraAction}
          </div>
        </div>
      )}

      {project.stage === "InProgress" && (
        <div className="flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            id="gov-complete-btn"
            disabled={loadingAction === "complete"}
            onClick={() => void onExecute("complete", () => completeProject(project.id))}
            className="rounded border border-primary-container bg-primary-container/25 px-[16px] py-[10px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/35 disabled:opacity-50"
          >
            Mark Project Completed
          </button>
          {extraAction}
        </div>
      )}

      {project.stage !== "OpenForResponse" && project.stage !== "InProgress" && extraAction && (
        <div className="flex flex-wrap items-center gap-[10px]">
          {extraAction}
        </div>
      )}

      {project.halt_reason && (
        <p className="text-xs text-warning font-data-mono">HALT REASON: {project.halt_reason}</p>
      )}

      {showConfirmModal && project.response_deadline && (
        <GovInProgressConfirmModal
          deadline={project.response_deadline}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => {
            setShowConfirmModal(false);
            void onExecute("in_progress", () => startInProgress(project.id));
          }}
          submitting={loadingAction === "in_progress"}
        />
      )}
    </div>
  );
}
