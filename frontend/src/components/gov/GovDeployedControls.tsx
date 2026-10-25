"use client";

import { useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import {
  completeProject,
  GovProject,
  startInProgress,
} from "@/services/gov";
import { GovInProgressConfirmModal } from "./GovInProgressConfirmModal";
import { GovExtendDeadlineModal } from "./GovExtendDeadlineModal";
import { GovDeployedEditModal } from "./GovDeployedEditModal";
import { GovSiteChangeModal } from "./GovSiteChangeModal";
import { SiteChange } from "@/services/siteChange";

interface GovDeployedControlsProps {
  project: GovProject;
  siteChange?: SiteChange | null;
  loadingAction: string | null;
  onExecute: (name: string, fn: () => Promise<unknown>) => Promise<void>;
  onOpenReason: (action: "halt" | "recall", title: string) => void;
  onError: (err: string) => void;
  onRefresh?: () => void;
  extraAction?: React.ReactNode;
}

export function GovDeployedControls({
  project,
  siteChange,
  loadingAction,
  onExecute,
  onOpenReason,
  onRefresh,
  extraAction,
}: GovDeployedControlsProps) {
  const { user } = useAuth();
  const isCreator = user?.role === "Government Official" && user?.id === project.created_by;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSiteChangeModal, setShowSiteChangeModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasOpenSiteChange = siteChange && ["requested", "proposed", "approved", "rejected"].includes(siteChange.status);

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
      {successMessage && (
        <div id="gov-deployed-success-msg" className="rounded border border-primary-container/40 bg-primary-container/15 p-[10px] text-xs text-primary font-data-mono">
          {successMessage}
        </div>
      )}
      {project.stage === "OpenForResponse" && (
        <div className="space-y-[16px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            {isCreator && (
              <>
                <button
                  type="button"
                  id="gov-edit-details-btn"
                  onClick={() => setShowEditModal(true)}
                  className="rounded border border-white/20 bg-white/5 px-[14px] py-[8px] font-data-mono text-[11px] text-white uppercase hover:border-white/40"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  id="gov-extend-deadline-btn"
                  onClick={() => setShowExtendModal(true)}
                  className="rounded border border-primary-container bg-primary-container/20 px-[14px] py-[8px] font-data-mono text-[11px] text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50"
                >
                  Extend deadline
                </button>
                {!hasOpenSiteChange && (
                  <button
                    type="button"
                    id="gov-request-site-change-btn"
                    onClick={() => setShowSiteChangeModal(true)}
                    className="rounded border border-primary-container bg-primary-container/20 px-[14px] py-[8px] font-data-mono text-[11px] text-primary uppercase hover:bg-primary-container/30 disabled:opacity-50"
                  >
                    Request site change
                  </button>
                )}
              </>
            )}
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

      {showExtendModal && (
        <GovExtendDeadlineModal
          project={project}
          onClose={() => setShowExtendModal(false)}
          onSuccess={() => {
            void onExecute("extend_deadline", async () => {});
          }}
        />
      )}

      {showEditModal && (
        <GovDeployedEditModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(null), 5000);
            void onExecute("deployed_edit", async () => {});
          }}
        />
      )}

      {showSiteChangeModal && (
        <GovSiteChangeModal
          projectId={project.id}
          initialLat={project.site_area_lat}
          initialLng={project.site_area_lng}
          initialRadiusKm={project.site_area_radius_km}
          onClose={() => setShowSiteChangeModal(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            else void onExecute("site_change", async () => {});
          }}
        />
      )}
    </div>
  );
}
