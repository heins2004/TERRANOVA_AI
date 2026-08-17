export const projectStatusClasses: Record<string, string> = { Proposed: "border-secondary/40 bg-secondary/10 text-secondary", Approved: "border-primary/40 bg-primary/10 text-primary", InProgress: "border-primary-container/50 bg-primary-container/10 text-primary-container", Completed: "border-success/40 bg-success/10 text-success", OnHold: "border-danger/40 bg-danger/10 text-danger" };
export const projectStatusMarkerColors: Record<string, string> = { Proposed: "#bdc2ff", Approved: "#8aebff", InProgress: "#22d3ee", Completed: "#1b7f5f", OnHold: "#c43d37" };

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full border px-[10px] py-[4px] font-data-mono text-[11px] uppercase tracking-wider ${projectStatusClasses[status] ?? projectStatusClasses.Proposed}`}>{status}</span>;
}
