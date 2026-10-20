"use client";

import { useEffect, useState } from "react";
import {
  AdminPlannerCredentialItem,
  CredentialStatus,
  getAdminDocumentUrl,
  getAdminPlannerCredentials,
  rejectPlannerCredentials,
  verifyPlannerCredentials,
} from "@/services/plannerCredentials";

export function AdminPlannerVerificationSection() {
  const [items, setItems] = useState<AdminPlannerCredentialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedItem, setSelectedItem] = useState<AdminPlannerCredentialItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmVerify, setConfirmVerify] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminPlannerCredentials({
      status: statusFilter || undefined,
      limit,
      offset: (page - 1) * limit,
    })
      .then((res) => {
        if (active) {
          setItems(res.items);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (active) setFeedback({ msg: err instanceof Error ? err.message : "Failed to load credentials.", type: "error" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter, page, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function openReview(item: AdminPlannerCredentialItem) {
    setSelectedItem(item);
    setIsReviewOpen(true);
    setRejectReason("");
    setRejectError("");
    setConfirmVerify(false);
    setIsRejecting(false);
  }

  async function handleVerify() {
    if (!selectedItem) return;
    setIsVerifying(true);
    setFeedback(null);
    try {
      await verifyPlannerCredentials(selectedItem.user_id);
      setFeedback({ msg: `Verified credentials for ${selectedItem.full_name}.`, type: "success" });
      setIsReviewOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFeedback({ msg: err instanceof Error ? err.message : "Verification failed.", type: "error" });
    } finally {
      setIsVerifying(false);
      setConfirmVerify(false);
    }
  }

  async function handleReject() {
    if (!selectedItem) return;
    const cleanReason = rejectReason.trim();
    if (cleanReason.length < 10 || cleanReason.length > 500) {
      setRejectError("Rejection reason must be between 10 and 500 characters.");
      return;
    }
    setIsVerifying(true);
    setFeedback(null);
    try {
      await rejectPlannerCredentials(selectedItem.user_id, cleanReason);
      setFeedback({ msg: `Rejected credentials for ${selectedItem.full_name}.`, type: "success" });
      setIsReviewOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFeedback({ msg: err instanceof Error ? err.message : "Rejection failed.", type: "error" });
    } finally {
      setIsVerifying(false);
    }
  }

  const renderBadge = (st: CredentialStatus) => {
    if (st === "Verified") return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-[8px] py-[2px] font-data-mono text-[10px] text-emerald-400">Verified</span>;
    if (st === "Pending") return <span className="rounded-full border border-primary/40 bg-primary/10 px-[8px] py-[2px] font-data-mono text-[10px] text-primary">Pending</span>;
    if (st === "Rejected") return <span className="rounded-full border border-danger/40 bg-danger/10 px-[8px] py-[2px] font-data-mono text-[10px] text-danger">Rejected</span>;
    return <span className="rounded-full border border-white/20 bg-white/5 px-[8px] py-[2px] font-data-mono text-[10px] text-on-surface-variant">Unsubmitted</span>;
  };

  return (
    <section id="admin-planner-verification" className="rounded-xl border border-white/10 bg-surface-container-lowest/80 p-[20px] sm:p-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-[16px] border-b border-white/10 pb-[16px]">
        <div>
          <div className="flex items-center gap-[8px]">
            <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
            <h3 className="font-sans text-[16px] font-bold text-white">Planner Verification</h3>
          </div>
          <p className="mt-[2px] text-[13px] text-on-surface-variant">
            Review professional credentials submitted by Urban Planners for official listing.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-[6px]">
          {["Pending", "Verified", "Rejected", "Unsubmitted", ""].map((f) => (
            <button
              key={f}
              type="button"
              id={`filter-cred-${f || "all"}`}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`rounded px-[10px] py-[4px] font-data-mono text-[11px] font-semibold uppercase transition-all ${
                statusFilter === f
                  ? "border border-primary bg-primary/20 text-primary"
                  : "border border-white/10 bg-surface-bright/20 text-on-surface-variant hover:text-white"
              }`}
            >
              {f || "All"}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`mt-[16px] rounded p-[12px] text-[13px] border ${feedback.type === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-danger/40 bg-danger/10 text-danger"}`}>
          {feedback.msg}
        </div>
      )}

      {loading ? (
        <div className="py-[32px] text-center font-data-mono text-[13px] text-on-surface-variant">Loading records...</div>
      ) : items.length === 0 ? (
        <div className="py-[36px] text-center">
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">assignment_turned_in</span>
          <p className="mt-[8px] font-data-mono text-[12px] uppercase tracking-wider text-on-surface-variant">
            No planner credential submissions match this filter.
          </p>
        </div>
      ) : (
        <div className="mt-[16px] overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <th className="py-[8px] pr-[12px]">Planner</th>
                <th className="py-[8px] px-[12px]">Email</th>
                <th className="py-[8px] px-[12px]">Registration #</th>
                <th className="py-[8px] px-[12px]">Status</th>
                <th className="py-[8px] px-[12px]">Submitted</th>
                <th className="py-[8px] pl-[12px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.user_id} className="hover:bg-white/[0.02]">
                  <td className="py-[10px] pr-[12px] font-medium text-white">{item.full_name}</td>
                  <td className="py-[10px] px-[12px] text-on-surface-variant font-data-mono text-[12px]">{item.email}</td>
                  <td className="py-[10px] px-[12px] font-data-mono text-primary text-[12px]">{item.registration_number || "—"}</td>
                  <td className="py-[10px] px-[12px]">{renderBadge(item.status)}</td>
                  <td className="py-[10px] px-[12px] text-on-surface-variant font-data-mono text-[11px]">
                    {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-[10px] pl-[12px] text-right">
                    <button
                      type="button"
                      id={`btn-review-planner-${item.user_id}`}
                      onClick={() => openReview(item)}
                      className="rounded border border-primary/40 bg-primary/10 px-[10px] py-[4px] font-data-mono text-[11px] font-semibold text-primary uppercase hover:bg-primary/20"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mt-[16px] flex items-center justify-between border-t border-white/10 pt-[12px]">
              <span className="font-data-mono text-[11px] text-on-surface-variant">Page {page} of {totalPages} ({total} records)</span>
              <div className="flex gap-[8px]">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-white/10 px-[10px] py-[4px] font-data-mono text-[11px] disabled:opacity-40">Prev</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-white/10 px-[10px] py-[4px] font-data-mono text-[11px] disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {isReviewOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-[16px] backdrop-blur-sm">
          <div className="w-full max-w-[540px] rounded-xl border border-white/15 bg-surface-container-lowest p-[24px] shadow-2xl space-y-[16px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
              <h4 className="font-sans text-[16px] font-bold text-white">Review Planner Credentials</h4>
              <button type="button" onClick={() => setIsReviewOpen(false)} className="text-on-surface-variant hover:text-white">✕</button>
            </div>

            <div className="space-y-[8px] text-[13px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Planner:</span><span className="font-medium text-white">{selectedItem.full_name}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Email:</span><span className="font-data-mono text-white">{selectedItem.email}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Registration #:</span><span className="font-data-mono text-primary font-bold">{selectedItem.registration_number || "None"}</span></div>
              {selectedItem.body_name && <div className="flex justify-between"><span className="text-on-surface-variant">Body:</span><span className="text-white">{selectedItem.body_name}</span></div>}
              <div className="flex justify-between"><span className="text-on-surface-variant">Status:</span><span>{renderBadge(selectedItem.status)}</span></div>
              {selectedItem.document_original_name && (
                <div className="flex items-center justify-between rounded bg-white/[0.03] p-[8px]">
                  <span className="font-data-mono text-[12px] text-white truncate max-w-[280px]">{selectedItem.document_original_name}</span>
                  <a
                    id="admin-download-cred-doc-btn"
                    href={getAdminDocumentUrl(selectedItem.user_id)}
                    download={selectedItem.document_original_name}
                    className="inline-flex items-center gap-[4px] rounded border border-primary/50 bg-primary/20 px-[10px] py-[4px] font-data-mono text-[11px] text-primary uppercase hover:bg-primary/30"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Download
                  </a>
                </div>
              )}
            </div>

            {selectedItem.status === "Pending" && (
              <div className="border-t border-white/10 pt-[16px] space-y-[12px]">
                {!isRejecting ? (
                  <div className="flex flex-wrap items-center justify-between gap-[10px]">
                    {confirmVerify ? (
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[12px] text-emerald-400">Confirm verification?</span>
                        <button id="admin-confirm-verify-btn" type="button" disabled={isVerifying} onClick={handleVerify} className="rounded bg-emerald-600 px-[12px] py-[6px] font-data-mono text-[11px] font-bold text-white uppercase hover:bg-emerald-500">Yes, Verify</button>
                        <button type="button" onClick={() => setConfirmVerify(false)} className="text-[12px] text-on-surface-variant underline">Cancel</button>
                      </div>
                    ) : (
                      <button id="admin-verify-btn" type="button" onClick={() => setConfirmVerify(true)} className="rounded border border-emerald-500 bg-emerald-500/20 px-[14px] py-[7px] font-data-mono text-[11px] font-bold text-emerald-400 uppercase hover:bg-emerald-500/30">Verify Credentials</button>
                    )}
                    <button id="admin-show-reject-btn" type="button" onClick={() => setIsRejecting(true)} className="rounded border border-danger/60 bg-danger/10 px-[14px] py-[7px] font-data-mono text-[11px] font-bold text-danger uppercase hover:bg-danger/20">Reject Submission</button>
                  </div>
                ) : (
                  <div className="space-y-[8px]">
                    <label htmlFor="admin-reject-reason-input" className="block font-data-mono text-[11px] uppercase text-danger">Rejection Reason (10-500 characters) *</label>
                    <textarea
                      id="admin-reject-reason-input"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
                      placeholder="Explain why credentials were rejected (minimum 10 characters)..."
                      className="w-full rounded border border-danger/40 bg-surface-bright/20 p-[8px] text-[13px] text-white focus:border-danger focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant font-data-mono">{rejectReason.length}/500 chars</span>
                      {rejectError && <span className="text-danger">{rejectError}</span>}
                    </div>
                    <div className="flex justify-end gap-[8px] pt-[4px]">
                      <button type="button" onClick={() => { setIsRejecting(false); setRejectError(""); }} className="px-[10px] py-[6px] text-[12px] text-on-surface-variant">Cancel</button>
                      <button id="admin-confirm-reject-btn" type="button" disabled={isVerifying} onClick={handleReject} className="rounded bg-danger px-[14px] py-[6px] font-data-mono text-[11px] font-bold text-white uppercase hover:opacity-90">Confirm Rejection</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
