"use client";

import { useState } from "react";
import { GovProject } from "@/services/gov";
import { isStartDateAfterDeadline } from "@/lib/dateRules";

interface GovApprovedControlsProps {
  project: GovProject;
  canDeploy: boolean;
  loadingAction: string | null;
  onOpenEdit: () => void;
  onDeploy: (targetIso: string) => void;
}

export function GovApprovedControls({
  project,
  canDeploy,
  loadingAction,
  onOpenEdit,
  onDeploy,
}: GovApprovedControlsProps) {
  const [deployDeadline, setDeployDeadline] = useState("");

  const isDateValid = !deployDeadline || isStartDateAfterDeadline(project.start_date, deployDeadline);
  const isDeployDisabled = !canDeploy || !isDateValid || loadingAction === "deploy";

  return (
    <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[16px] space-y-[12px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <span className="font-data-mono text-[11px] text-primary uppercase">APPROVED — PRE-DEPLOYMENT</span>
        <button
          type="button"
          id="gov-final-edit-btn"
          onClick={onOpenEdit}
          className="rounded border border-white/20 px-[14px] py-[6px] font-data-mono text-[11px] text-white uppercase hover:border-white/40"
        >
          Final Edit
        </button>
      </div>

      <div className="space-y-[10px] border-t border-white/10 pt-[10px]">
        <div>
          <label className="block font-data-mono text-[11px] text-on-surface-variant uppercase">
            Public Response Deadline
          </label>
          <input
            type="date"
            id="gov-deploy-deadline"
            value={deployDeadline}
            onChange={(e) => setDeployDeadline(e.target.value)}
            className="mt-[4px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[6px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>

        {!isDateValid && (
          <p id="gov-deploy-date-error" className="text-xs text-danger font-data-mono">
            Start date must be after the response deadline. Edit the project start date first.
          </p>
        )}

        {!canDeploy && (
          <p className="text-xs text-danger font-data-mono">
            DEPLOY DISABLED: Planner deployment permission has not been granted and planner deadline has not expired.
          </p>
        )}

        <button
          type="button"
          id="gov-deploy-btn"
          disabled={isDeployDisabled}
          title={!isDateValid ? "Start date must be after the response deadline. Edit the project start date first." : undefined}
          onClick={() => {
            const target = deployDeadline
              ? new Date(deployDeadline).toISOString()
              : new Date(Date.now() + 30 * 86400000).toISOString();
            onDeploy(target);
          }}
          className="w-full rounded border border-primary-container bg-primary-container/25 py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/35 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingAction === "deploy"
            ? "Deploying..."
            : !isDateValid
            ? "Start date must be after the response deadline. Edit the project start date first."
            : "Deploy to Public Consultation"}
        </button>
      </div>
    </div>
  );
}
