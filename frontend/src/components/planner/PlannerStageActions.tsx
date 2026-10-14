"use client";

import { useRef, useState } from "react";
import {
  acceptInvite,
  declineInvite,
  grantPlannerPermission,
  PlannerProject,
} from "@/services/planner";
import { SiteProposalForm } from "@/components/planner/SiteProposalForm";

interface PlannerStageActionsProps {
  project: PlannerProject;
  onActionComplete: () => void;
}

export function PlannerStageActions({
  project,
  onActionComplete,
}: PlannerStageActionsProps) {
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmGrant, setShowConfirmGrant] = useState(false);
  const isSubmittingRef = useRef(false);

  async function handleAcceptInvite() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setGeneralError("");
    try {
      await acceptInvite(project.id);
      onActionComplete();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to accept invite.");
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  async function handleDeclineInvite() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setGeneralError("");
    try {
      await declineInvite(project.id);
      onActionComplete();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to decline invite.");
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  async function handleGrantPermission() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setGeneralError("");
    try {
      await grantPlannerPermission(project.id);
      setShowConfirmGrant(false);
      onActionComplete();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to grant deploy permission.");
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-[24px]">
      {generalError && (
        <div className="mb-[20px] rounded border border-danger/40 bg-danger/10 p-[14px]">
          <p className="font-data-mono text-xs text-danger">{generalError}</p>
        </div>
      )}

      {/* 1. Stage: Planner invited */}
      {project.stage === "Planner invited" && (
        <div>
          {!project.planner_id && (
            <div className="mb-[24px] rounded-lg border border-primary-container/40 bg-primary-container/10 p-[16px]">
              <p className="font-data-mono text-xs text-primary uppercase tracking-wide font-semibold">
                PENDING PLANNER INVITATION
              </p>
              <div className="mt-[12px] flex items-center gap-[12px]">
                <button
                  type="button"
                  id="planner-detail-accept-invite-btn"
                  onClick={handleAcceptInvite}
                  disabled={isLoading}
                  className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[11px] font-semibold uppercase tracking-wider text-primary hover:bg-primary-container/30 disabled:opacity-50"
                >
                  {isLoading ? "ACCEPTING..." : "ACCEPT INVITATION"}
                </button>
                <button
                  type="button"
                  id="planner-detail-decline-invite-btn"
                  onClick={handleDeclineInvite}
                  disabled={isLoading}
                  className="rounded border border-danger/60 px-[14px] py-[8px] font-data-mono text-[11px] font-semibold uppercase tracking-wider text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  {isLoading ? "DECLINING..." : "DECLINE INVITATION"}
                </button>
              </div>
            </div>
          )}

          <SiteProposalForm
            projectId={project.id}
            rejectionReason={project.proposal_rejection_reason}
            siteAreaLat={project.site_area_lat}
            siteAreaLng={project.site_area_lng}
            siteAreaRadiusKm={project.site_area_radius_km}
            onSuccess={onActionComplete}
          />
        </div>
      )}

      {/* 2. Stage: Site proposed & Under consideration */}
      {(project.stage === "Site proposed" || project.stage === "Under consideration") && (
        <div className="space-y-[16px]">
          <div className="rounded-lg border border-primary-container/40 bg-primary-container/10 p-[16px]">
            <p className="font-data-mono text-xs font-semibold uppercase tracking-wide text-primary">
              CURRENT STAGE: {project.stage.toUpperCase()}
            </p>
            <p className="mt-[6px] text-sm text-foreground leading-relaxed">
              Site proposal submitted. Waiting for government official review and evaluation.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.01] p-[16px]">
            <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              PROPOSED COORDINATES (READ-ONLY)
            </span>
            <div className="mt-[8px] flex flex-wrap gap-[16px] font-data-mono text-xs">
              <div>
                <span className="text-muted-foreground">LATITUDE:</span>{" "}
                <span className="text-foreground">{project.location_lat ?? "Pending"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">LONGITUDE:</span>{" "}
                <span className="text-foreground">{project.location_lng ?? "Pending"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Stage: Approved */}
      {project.stage === "Approved" && (
        <div className="space-y-[16px]">
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-[16px]">
            <p className="font-data-mono text-xs font-semibold uppercase tracking-wide text-emerald-400">
              STAGE: APPROVED
            </p>
            <p className="mt-[6px] text-sm text-foreground">
              Site proposal approved by the government official. Urban planner deployment permission is required
              prior to deployment.
            </p>
          </div>

          {project.planner_deploy_permitted ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-[16px]">
              <span className="font-data-mono text-xs uppercase text-emerald-400 font-semibold">
                &check; DEPLOY PERMISSION GRANTED BY PLANNER
              </span>
              <p className="mt-[4px] text-xs text-on-surface-variant">
                Waiting for the government official to deploy the project.
              </p>
            </div>
          ) : (
            <div>
              {!showConfirmGrant ? (
                <button
                  type="button"
                  id="planner-grant-deploy-permission-btn"
                  onClick={() => setShowConfirmGrant(true)}
                  disabled={isLoading}
                  className="rounded border border-primary-container bg-primary-container/20 px-[20px] py-[10px] font-data-mono text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary-container/30 disabled:opacity-50"
                >
                  GRANT DEPLOY PERMISSION
                </button>
              ) : (
                <div className="rounded-lg border border-primary-container/60 bg-primary-container/10 p-[16px]">
                  <p className="font-data-mono text-xs uppercase text-primary font-semibold">
                    CONFIRM DEPLOY PERMISSION
                  </p>
                  <p className="mt-[6px] text-xs text-on-surface-variant">
                    Are you sure you want to grant urban planning clearance for this project to be deployed?
                  </p>
                  <div className="mt-[14px] flex items-center gap-[12px]">
                    <button
                      type="button"
                      id="planner-confirm-grant-deploy-btn"
                      onClick={handleGrantPermission}
                      disabled={isLoading}
                      className="rounded border border-primary-container bg-primary-container/30 px-[16px] py-[8px] font-data-mono text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary-container/40 disabled:opacity-50"
                    >
                      {isLoading ? "GRANTING..." : "CONFIRM & GRANT"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmGrant(false)}
                      disabled={isLoading}
                      className="rounded border border-white/20 px-[14px] py-[8px] font-data-mono text-xs uppercase text-on-surface-variant hover:text-foreground"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Deployed stages */}
      {["OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"].includes(
        project.stage
      ) && (
        <div className="space-y-[16px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-[16px]">
            <p className="font-data-mono text-xs uppercase text-primary font-semibold">
              STAGE: {project.stage.toUpperCase()} (DEPLOYED)
            </p>
            <p className="mt-[4px] text-xs text-on-surface-variant">
              This project is currently deployed and managed under the public workflow.
            </p>
            {project.response_deadline && (
              <p className="mt-[8px] font-data-mono text-xs text-on-surface-variant">
                RESPONSE DEADLINE:{" "}
                <span className="text-foreground">
                  {new Date(project.response_deadline).toLocaleString("en-IN")}
                </span>
              </p>
            )}
          </div>

          {project.stage === "Halted" && project.halt_reason && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-[16px]">
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-danger font-semibold">
                PUBLIC HALT REASON:
              </span>
              <p className="mt-[6px] text-sm text-foreground leading-relaxed">
                {project.halt_reason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
