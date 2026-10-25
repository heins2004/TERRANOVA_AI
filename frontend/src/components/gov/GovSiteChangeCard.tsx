"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  approveSiteChange,
  cancelSiteChange,
  redeploySiteChange,
  rejectSiteChange,
  SiteChange,
} from "@/services/siteChange";
import { GovReasonModal } from "@/components/gov/GovReasonModal";

const SiteAreaMap = dynamic(
  () => import("@/components/maps/SiteAreaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] w-full items-center justify-center rounded border border-white/10 bg-black/40 font-data-mono text-xs text-on-surface-variant">
        LOADING MAP...
      </div>
    ),
  }
);

interface GovSiteChangeCardProps {
  projectId: number;
  change: SiteChange;
  onRefresh: () => void;
}

export function GovSiteChangeCard({
  projectId,
  change,
  onRefresh,
}: GovSiteChangeCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRedeployConfirm, setShowRedeployConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isOpen = ["requested", "proposed", "approved", "rejected"].includes(change.status);
  if (!isOpen) return null;

  async function handleApprove() {
    setLoadingAction("approve");
    setError("");
    try {
      await approveSiteChange(projectId);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve site change.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReject(reason: string) {
    setError("");
    try {
      await rejectSiteChange(projectId, reason);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject site proposal.");
    }
  }

  async function handleRedeploy() {
    setLoadingAction("redeploy");
    setError("");
    try {
      await redeploySiteChange(projectId);
      setShowRedeployConfirm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeploy site change.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCancel() {
    setLoadingAction("cancel");
    setError("");
    try {
      await cancelSiteChange(projectId);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel site change.");
    } finally {
      setLoadingAction(null);
    }
  }

  const hasProposedCoords =
    change.proposed_site_lat != null && change.proposed_site_lng != null;

  const osmUrl = hasProposedCoords
    ? `https://www.openstreetmap.org/?mlat=${change.proposed_site_lat}&mlon=${change.proposed_site_lng}#map=17/${change.proposed_site_lat}/${change.proposed_site_lng}`
    : "#";

  return (
    <div
      id="gov-site-change-card"
      className="mt-[16px] rounded-[12px] border border-warning/30 bg-warning/[0.04] p-[16px] sm:p-[20px] space-y-[16px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-white/10 pb-[12px]">
        <div>
          <span className="font-data-mono text-[10px] uppercase text-warning tracking-wider">
            Site Change in Progress
          </span>
          <h4 className="font-sans text-[16px] font-semibold text-white">
            Status: <span className="text-warning capitalize">{change.status}</span>
          </h4>
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            id="gov-cancel-site-change-btn"
            disabled={loadingAction != null}
            onClick={handleCancel}
            className="rounded border border-white/20 bg-white/5 px-[12px] py-[6px] font-data-mono text-[11px] text-on-surface-variant hover:text-white uppercase transition-colors disabled:opacity-50"
          >
            {loadingAction === "cancel" ? "Cancelling..." : "Cancel Change"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 p-[10px] font-data-mono text-xs text-danger">
          {error}
        </div>
      )}

      <div className="space-y-[8px]">
        <div>
          <span className="block font-data-mono text-[10px] text-on-surface-variant uppercase">
            Official Reason
          </span>
          <p className="text-sm text-white/90">{change.reason}</p>
        </div>

        {change.rejection_reason && (
          <div>
            <span className="block font-data-mono text-[10px] text-danger uppercase">
              Last Rejection Reason
            </span>
            <p className="text-sm text-danger/90">{change.rejection_reason}</p>
          </div>
        )}
      </div>

      {hasProposedCoords && (
        <div className="rounded-[8px] border border-white/10 bg-black/30 p-[14px] space-y-[10px]">
          <span className="font-data-mono text-[10px] uppercase text-primary tracking-wider">
            Proposed Candidate Site
          </span>
          {change.proposed_site_name && (
            <h5 className="font-sans text-[15px] font-semibold text-white">
              {change.proposed_site_name}
            </h5>
          )}
          {change.proposed_site_explanation && (
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {change.proposed_site_explanation}
            </p>
          )}
          <div className="font-data-mono text-[11px] text-primary">
            COORDINATES: {change.proposed_site_lat!.toFixed(4)}, {change.proposed_site_lng!.toFixed(4)}
          </div>

          <div className="relative h-[200px] w-full rounded overflow-hidden border border-white/10">
            <SiteAreaMap
              centerLat={change.proposed_site_lat!}
              centerLng={change.proposed_site_lng!}
              radiusKm={0.5}
              readOnly={true}
              pinLat={change.proposed_site_lat!}
              pinLng={change.proposed_site_lng!}
            />
          </div>

          <a
            id="gov-site-change-osm-link"
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[4px] text-[12px] font-data-mono text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            VIEW ON MAP
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-[10px] pt-[4px]">
        {change.status === "proposed" && (
          <>
            <button
              type="button"
              id="gov-approve-site-change-btn"
              disabled={loadingAction != null}
              onClick={handleApprove}
              className="rounded border border-primary-container bg-primary-container/25 px-[14px] py-[8px] font-data-mono text-xs font-semibold text-primary uppercase hover:bg-primary-container/35 disabled:opacity-50"
            >
              {loadingAction === "approve" ? "Approving..." : "Approve Site Proposal"}
            </button>
            <button
              type="button"
              id="gov-reject-site-change-btn"
              disabled={loadingAction != null}
              onClick={() => setShowRejectModal(true)}
              className="rounded border border-danger/40 bg-danger/10 px-[14px] py-[8px] font-data-mono text-xs text-danger uppercase hover:bg-danger/20 disabled:opacity-50"
            >
              Reject Proposal
            </button>
          </>
        )}

        {change.status === "approved" && (
          <button
            type="button"
            id="gov-redeploy-site-change-btn"
            disabled={loadingAction != null}
            onClick={() => setShowRedeployConfirm(true)}
            className="rounded border border-primary-container bg-primary-container/30 px-[16px] py-[8px] font-data-mono text-xs font-semibold text-primary uppercase hover:bg-primary-container/40 disabled:opacity-50 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
          >
            {loadingAction === "redeploy" ? "Redeploying..." : "Redeploy"}
          </button>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <GovReasonModal
          title="Reject Site Proposal (Requires Feedback)"
          onClose={() => setShowRejectModal(false)}
          onSubmit={handleReject}
        />
      )}

      {/* Redeploy Confirm Dialog */}
      {showRedeployConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="redeploy-confirm-title"
          className="fixed inset-0 z-[1060] flex items-center justify-center p-[16px] bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-[440px] rounded-[12px] border border-white/15 bg-surface-container-lowest p-[24px] shadow-2xl space-y-[16px]">
            <h4 id="redeploy-confirm-title" className="font-sans text-[16px] font-bold text-white">
              Confirm Redeployment
            </h4>
            <p className="text-sm text-white/90">
              The public site will change and followers will be notified. Continue?
            </p>
            <div className="flex justify-end gap-[10px] pt-[8px]">
              <button
                type="button"
                id="gov-redeploy-cancel-btn"
                onClick={() => setShowRedeployConfirm(false)}
                className="rounded border border-white/20 bg-white/5 px-[14px] py-[8px] font-data-mono text-xs text-white uppercase hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                id="gov-redeploy-confirm-btn"
                disabled={loadingAction === "redeploy"}
                onClick={handleRedeploy}
                className="rounded border border-primary-container bg-primary-container/30 px-[16px] py-[8px] font-data-mono text-xs font-semibold text-primary uppercase hover:bg-primary-container/40 disabled:opacity-50"
              >
                {loadingAction === "redeploy" ? "Redeploying..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
