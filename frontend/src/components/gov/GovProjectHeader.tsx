"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/common/CopyButton";
import {
  approveProposal,
  cancelInvite,
  deployProject,
  GovProject,
  haltProject,
  recallProject,
  rejectProposal,
} from "@/services/gov";
import { GovReasonModal } from "./GovReasonModal";
import { GovDeployedControls } from "./GovDeployedControls";
import { GovConsultationFormModal } from "./GovConsultationModal";

interface GovProjectHeaderProps {
  project: GovProject;
  onRefresh: () => void;
  onOpenEdit: () => void;
}

export function GovProjectHeader({ project, onRefresh, onOpenEdit }: GovProjectHeaderProps) {
  const isActionRef = useRef(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const [reasonModal, setReasonModal] = useState<{ action: "reject" | "halt" | "recall"; title: string } | null>(null);
  const [deployDeadline, setDeployDeadline] = useState("");

  const [nowTime, setNowTime] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

  const isDeployed = ["OpenForResponse", "InProgress", "Completed", "Halted"].includes(project.stage);

  const addConsultationBtn = isDeployed ? (
    <button
      type="button"
      id="gov-add-consultation-btn"
      onClick={() => setShowConsultationModal(true)}
      className="rounded-[6px] bg-cyan-600 px-[14px] py-[8px] font-sans text-xs font-semibold text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
    >
      Add consultation
    </button>
  ) : null;

  return (
    <div className="space-y-[20px]">
      {/* Header navigation, title & top-right stage operations */}
      <div>
        <div className="flex items-center gap-[8px] font-data-mono text-[11px] text-on-surface-variant uppercase">
          <Link href="/gov" className="hover:text-primary transition-colors">Official Portal</Link>
          <span>/</span>
          <span>Project #{project.id}</span>
        </div>

        <div className="mt-[8px] flex flex-wrap items-start justify-between gap-[16px]">
          <div className="max-w-2xl">
            <div className="flex items-center gap-[10px]">
              <span className="rounded border border-primary-container/40 bg-primary-container/15 px-[10px] py-[3px] font-data-mono text-[11px] font-semibold text-primary uppercase">
                {project.stage}
              </span>
              <span className="font-data-mono text-xs text-on-surface-variant uppercase">
                City: {project.city ?? "National"}
              </span>
            </div>
            <h1 className="mt-[8px] font-sans text-[26px] font-bold text-white tracking-tight">
              {project.title}
            </h1>
            <div id="gov-project-id-row" className="mt-[6px] flex flex-wrap items-center gap-[8px] font-data-mono text-xs text-on-surface-variant">
              <span>Project ID: {project.id}</span>
              <CopyButton text={project.id} label="Copy ID" />
            </div>
            {project.description && (
              <p className="mt-[6px] text-sm text-on-surface-variant">
                {project.description}
              </p>
            )}
          </div>

          {/* Top Right Corner of Page Header: Stage operation button(s) & Add consultation */}
          <div className="flex flex-wrap items-center gap-[10px] shrink-0">
            {/* Stage: Draft */}
            {project.stage === "Draft" && (
              <button
                type="button"
                id="gov-draft-edit-btn"
                onClick={onOpenEdit}
                className="rounded border border-white/20 bg-white/5 px-[16px] py-[8px] font-data-mono text-[12px] text-white uppercase hover:border-white/40"
              >
                Edit Details
              </button>
            )}

            {/* Stage: Planner invited */}
            {project.stage === "Planner invited" && (
              <div className="flex flex-wrap items-center gap-[10px]">
                <button
                  type="button"
                  id="gov-invited-edit-btn"
                  onClick={onOpenEdit}
                  className="rounded border border-white/20 bg-white/5 px-[14px] py-[8px] font-data-mono text-[11px] text-white uppercase hover:border-white/40"
                >
                  Edit Site Area
                </button>
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
            )}

            {/* Stage: Site proposed */}
            {project.stage === "Site proposed" && (
              <button
                type="button"
                id="gov-open-proposal-btn"
                disabled={loadingAction === "open"}
                onClick={() => void executeAction("open", async () => onRefresh())}
                className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50"
              >
                Review Proposal
              </button>
            )}

            {/* Stage: Under consideration */}
            {project.stage === "Under consideration" && (
              <div className="flex flex-wrap items-center gap-[10px]">
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
            )}

            {/* Stage: Approved */}
            {project.stage === "Approved" && (
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
                    className="w-full rounded border border-primary-container bg-primary-container/25 py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase hover:bg-primary-container/35 disabled:opacity-50 disabled:cursor-not-allowed"
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
                extraAction={addConsultationBtn}
              />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-[12px] rounded border border-danger/40 bg-danger/10 p-[12px] text-danger text-sm">
            {error}
          </div>
        )}

        {project.stage === "Draft" && !(project.site_area_lat != null && project.site_area_lng != null && project.site_area_radius_km != null) && (
          <div className="mt-[12px] rounded border border-warning/30 bg-warning/10 p-[12px] text-xs text-warning">
            Set the site area before inviting a planner. Use &quot;Edit Details&quot; above to define the circular site area.
          </div>
        )}
      </div>

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

      {/* Existing consultation create modal */}
      {showConsultationModal && (
        <GovConsultationFormModal
          projectId={project.id}
          consultation={null}
          onClose={() => setShowConsultationModal(false)}
          onSuccess={() => {
            setShowConsultationModal(false);
            onRefresh();
          }}
          city={project.city}
        />
      )}
    </div>
  );
}
