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
import { GovActivityMenu, ActivityMenuItem } from "./GovActivityMenu";
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
  onOpenConsultation?: () => void;
}

export function GovDeployedControls({
  project,
  siteChange,
  loadingAction,
  onExecute,
  onOpenReason,
  onRefresh,
  onOpenConsultation,
}: GovDeployedControlsProps) {
  const { user } = useAuth();
  const isCreator = user?.role === "Government Official" && user?.id === project.created_by;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSiteChangeModal, setShowSiteChangeModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasOpenSiteChange = Boolean(
    siteChange && ["requested", "proposed", "approved", "rejected"].includes(siteChange.status)
  );

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

  const menuItems: ActivityMenuItem[] = [];

  if (project.stage === "OpenForResponse") {
    if (isCreator) {
      menuItems.push({
        id: "gov-edit-details-btn",
        label: "Edit details",
        onClick: () => setShowEditModal(true),
      });
      menuItems.push({
        id: "gov-extend-deadline-btn",
        label: "Extend deadline",
        onClick: () => setShowExtendModal(true),
      });
      if (!hasOpenSiteChange) {
        menuItems.push({
          id: "gov-request-site-change-btn",
          label: "Request site change",
          onClick: () => setShowSiteChangeModal(true),
        });
      }
    }

    if (onOpenConsultation) {
      menuItems.push({
        id: "gov-add-consultation-btn",
        label: "Add consultation",
        onClick: onOpenConsultation,
      });
    }

    menuItems.push({
      id: "gov-in-progress-btn",
      label: "Move to In Progress",
      onClick: handleMoveToInProgressClick,
      disabled: loadingAction === "in_progress",
      disabledReason: "Action in progress",
    });

    menuItems.push({
      id: "gov-halt-btn",
      label: "Halt Project",
      onClick: () => onOpenReason("halt", "Halt Consultation (Public Reason)"),
      variant: "warning",
    });

    menuItems.push({
      id: "gov-recall-btn",
      label: "Recall Project",
      onClick: () => onOpenReason("recall", "Recall Project (Public Reason)"),
      variant: "danger",
    });
  } else if (project.stage === "InProgress") {
    menuItems.push({
      id: "gov-complete-btn",
      label: "Mark Project Completed",
      onClick: () => void onExecute("complete", () => completeProject(project.id)),
      disabled: loadingAction === "complete",
      disabledReason: "Action in progress",
    });

    if (onOpenConsultation) {
      menuItems.push({
        id: "gov-add-consultation-btn",
        label: "Add consultation",
        onClick: onOpenConsultation,
      });
    }
  } else if (["Completed", "Halted"].includes(project.stage)) {
    if (onOpenConsultation) {
      menuItems.push({
        id: "gov-add-consultation-btn",
        label: "Add consultation",
        onClick: onOpenConsultation,
      });
    }
  }

  if (menuItems.length === 0 && !project.halt_reason && !successMessage) {
    return null;
  }

  return (
    <div className="w-full md:w-auto min-w-0 max-w-full">
      {successMessage && (
        <div id="gov-deployed-success-msg" className="mb-[10px] rounded border border-primary-container/40 bg-primary-container/15 p-[10px] text-xs text-primary font-data-mono">
          {successMessage}
        </div>
      )}

      <GovActivityMenu items={menuItems} />

      {project.halt_reason && (
        <p className="mt-[8px] text-xs text-warning font-data-mono">HALT REASON: {project.halt_reason}</p>
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
