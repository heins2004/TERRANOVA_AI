"use client";

import { Complaint, ComplaintStatus, complaintStatuses } from "@/services/complaints";

const statusClasses: Record<ComplaintStatus, string> = {
  Submitted: "border-secondary/40 bg-secondary/10 text-secondary",
  UnderReview: "border-primary/40 bg-primary/10 text-primary",
  Resolved: "border-success/40 bg-success/10 text-success",
  Dismissed: "border-danger/40 bg-danger/10 text-danger",
};

export function ComplaintCard({ complaint, canUpdate, onStatusChange }: { complaint: Complaint; canUpdate: boolean; onStatusChange: (id: number, status: ComplaintStatus) => Promise<void> }) {
  const statusBadge = <span className={`rounded-full border px-[10px] py-[4px] font-data-mono text-[11px] uppercase tracking-wider ${statusClasses[complaint.status]}`}>{complaint.status}</span>;
  return <article className="glass-card rounded-xl p-[24px]"><div className="flex flex-wrap items-start justify-between gap-[16px]"><div><p className="font-data-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">Complaint #{complaint.id}{complaint.project_id ? ` · Project #${complaint.project_id}` : ""}</p><h2 className="mt-[8px] font-display-md text-[22px] text-on-surface">{complaint.subject}</h2></div>{canUpdate ? <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Status<select aria-label={`Update status for complaint ${complaint.id}`} className="mt-[8px] block border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[8px] text-sm text-on-surface" value={complaint.status} onChange={(event) => void onStatusChange(complaint.id, event.target.value as ComplaintStatus)}>{complaintStatuses.map((status) => <option key={status}>{status}</option>)}</select></label> : statusBadge}</div><p className="mt-[16px] whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{complaint.description}</p><div className="mt-[20px] border-t border-white/10 pt-[16px]">{canUpdate && statusBadge}<p className="mt-[8px] font-data-mono text-[11px] text-on-surface-variant">SUBMITTED {new Date(complaint.created_at).toLocaleDateString()}</p></div></article>;
}
