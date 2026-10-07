"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  approveProposal,
  cancelInvite,
  deployProject,
  GovProject,
  haltProject,
  recallProject,
  rejectProposal,
} from "@/services/gov";
import { GovPlannerSearch } from "./GovPlannerSearch";
import { GovReasonModal } from "./GovReasonModal";
import { GovDeployedControls } from "./GovDeployedControls";

interface GovStageActionsProps {
  project: GovProject;
  onRefresh: () => void;
  onOpenEdit: () => void;
}

export function GovStageActions({ project, onRefresh, onOpenEdit }: GovStageActionsProps) {
  const isActionRef = useRef(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [reasonModal, setReasonModal] = useState<{ action: "reject" | "halt" | "recall"; title: string } | null>(null);
  const [deployDeadline, setDeployDeadline] = useState("");

  const nowTime = useSyncExternalStore(
    () => () => {},
    () => Date.now(),
    () => 0
  );

  const deadlinePassed = Boolean(
    project.planner_deadline && nowTime > 0 && nowTime > new Date(project.planner_deadline).getTime()
  );
  const canDeploy = project.planner_deploy_permitted || deadlinePassed;

  async function executeAction(name: string, fn: () => Promise<unknown>) {
    if (isActionRef.current) return;
    isActionRef.current = true;
    setLoadingAction(name);
    setError("");

    try {
      await fn();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to execute ${name}.`);
    } finally {
      isActionRef.current = false;
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-[20px]">
      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 p-[12px] text-danger text-sm">
          {error}
        </div>
      )}

      {/* Stage: Draft */}
      {project.stage === "Draft" && (
        <div className="space-y-[16px]">
          <div className="flex gap-[12px]">
            <button
              type="button"
              id="gov-draft-edit-btn"
              onClick={onOpenEdit}
              className="rounded border border-white/20 bg-white/5 px-[16px] py-[8px] font-data-mono text-[12px] text-white uppercase hover:border-white/40"
            >
              Edit Details
            </button>
          </div>
          <GovPlannerSearch projectId={project.id} onSuccess={onRefresh} />
        </div>
      )}

      {/* Stage: Planner invited */}
      {project.stage === "Planner invited" && (
        <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <div>
              <span className="font-data-mono text-[11px] text-primary uppercase">INVITATION DISPATCHED</span>
              <p className="mt-[4px] text-sm text-white">
                Waiting for planner response. {project.planner_deadline ? `Deadline: ${new Date(project.planner_deadline).toLocaleDateString("en-IN")}` : ""}
              </p>
            </div>
            <button
              type="button"
              id="gov-cancel-invite-btn"
              disabled={loadingAction === "cancel"}
              onClick={() => void executeAction("cancel", () => cancelInvite(project.id))}
              className="rounded border border-danger/40 bg-danger/10 px-[14px] py-[8px] font-data-mono text-[11px] text-danger uppercase hover:bg-danger/20 disabled:opacity-50"
            >
              {loadingAction === "cancel" ? "Cancelling..." : "Cancel Invitation"}
            </button>
          </div>

          {deadlinePassed ? (
            <div className="border-t border-white/10 pt-[16px]">
              <div className="rounded bg-warning/10 border border-warning/30 p-[12px] mb-[12px] text-xs text-warning">
                Planner deadline has passed. You may now reassign this project to another active planner.
              </div>
              <GovPlannerSearch projectId={project.id} isReassign={true} onSuccess={onRefresh} />
            </div>
          ) : (
            <div className="border-t border-white/10 pt-[12px]">
              <p className="font-data-mono text-[11px] text-on-surface-variant">
                REASSIGNMENT DISABLED UNTIL PLANNER DEADLINE EXPIRES.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stage: Site proposed */}
      {project.stage === "Site proposed" && (
        <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[12px]">
          <p className="font-data-mono text-[11px] text-primary uppercase">CANDIDATE SITE SUBMITTED</p>
          <h4 className="text-white font-medium text-[16px]">{project.proposed_site_name ?? "Candidate Site"}</h4>
          <p className="text-sm text-on-surface-variant">{project.proposed_site_explanation}</p>
          <button
            type="button"
            id="gov-open-proposal-btn"
            disabled={loadingAction === "open"}
            onClick={() => void executeAction("open", async () => onRefresh())}
            className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50"
          >
            Review Proposal (Under Consideration)
          </button>
        </div>
      )}

      {/* Stage: Under consideration */}
      {project.stage === "Under consideration" && (
        <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[16px]">
          <div className="space-y-[6px]">
            <span className="font-data-mono text-[11px] text-primary uppercase">EVALUATING PROPOSAL</span>
            <h4 className="text-white font-medium text-[16px]">{project.proposed_site_name ?? "Candidate Site"}</h4>
            <p className="text-sm text-on-surface-variant">{project.proposed_site_explanation}</p>
            {project.proposed_site_lat != null && (
              <p className="font-data-mono text-[11px] text-on-surface-variant">
                COORDINATES: {project.proposed_site_lat.toFixed(4)}, {project.proposed_site_lng?.toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-[12px] pt-[8px] border-t border-white/10">
            <button
              type="button"
              id="gov-approve-proposal-btn"
              disabled={loadingAction === "approve"}
              onClick={() => void executeAction("approve", () => approveProposal(project.id))}
              className="rounded border border-primary-container bg-primary-container/25 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/35 disabled:opacity-50"
            >
              {loadingAction === "approve" ? "Approving..." : "Approve Site Proposal"}
            </button>
            <button
              type="button"
              id="gov-reject-proposal-btn"
              onClick={() => setReasonModal({ action: "reject", title: "Reject Proposal (Requires Feedback)" })}
              className="rounded border border-danger/40 bg-danger/10 px-[16px] py-[8px] font-data-mono text-[12px] text-danger uppercase hover:bg-danger/20"
            >
              Reject Proposal
            </button>
          </div>
        </div>
      )}

      {/* Stage: Approved */}
      {project.stage === "Approved" && (
        <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[16px]">
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
          <div className="space-y-[12px] border-t border-white/10 pt-[14px]">
            <div>
              <label className="block font-data-mono text-[11px] text-on-surface-variant uppercase">
                Public Response Deadline
              </label>
              <input
                type="date"
                id="gov-deploy-deadline"
                value={deployDeadline}
                onChange={(e) => setDeployDeadline(e.target.value)}
                className="mt-[4px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            {!canDeploy && (
              <p className="text-xs text-danger font-data-mono">
                DEPLOY DISABLED: Planner deployment permission has not been granted and planner deadline has not expired.
              </p>
            )}
            <button
              type="button"
              id="gov-deploy-btn"
              disabled={!canDeploy || loadingAction === "deploy"}
              onClick={() => {
                const target = deployDeadline ? new Date(deployDeadline).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();
                void executeAction("deploy", () => deployProject(project.id, target));
              }}
              className="w-full rounded border border-primary-container bg-primary-container/25 py-[10px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/35 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === "deploy" ? "Deploying..." : "Deploy to Public Consultation"}
            </button>
          </div>
        </div>
      )}

      {/* Deployed Stages */}
      {["OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"].includes(project.stage) && (
        <GovDeployedControls
          project={project}
          loadingAction={loadingAction}
          onExecute={executeAction}
          onOpenReason={(action, title) => setReasonModal({ action, title })}
          onError={setError}
        />
      )}

      {reasonModal && (
        <GovReasonModal
          title={reasonModal.title}
          onClose={() => setReasonModal(null)}
          onSubmit={async (reason) => {
            if (reasonModal.action === "reject") await rejectProposal(project.id, reason);
            else if (reasonModal.action === "halt") await haltProject(project.id, reason);
            else if (reasonModal.action === "recall") await recallProject(project.id, reason);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
