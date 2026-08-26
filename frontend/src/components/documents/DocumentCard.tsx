import { getDocumentDownloadUrl, PlanningDocument } from "@/services/documents";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentCard({ document, canDelete, onDelete }: { document: PlanningDocument; canDelete: boolean; onDelete: (id: number) => Promise<void> }) {
  return <article className="glass-card rounded-xl p-[24px]">
    <div className="flex flex-wrap items-start justify-between gap-[16px]"><div><p className="font-data-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">{document.category ?? "Planning document"}</p><h2 className="mt-[8px] font-display-md text-[22px] text-on-surface">{document.title}</h2></div><a className="border border-primary-container/60 px-[14px] py-[10px] font-data-mono text-[11px] text-primary hover:bg-primary-container/10" href={getDocumentDownloadUrl(document.id)}>DOWNLOAD</a></div>
    {document.description && <p className="mt-[16px] whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{document.description}</p>}
    <div className="mt-[20px] border-t border-white/10 pt-[16px] font-data-mono text-[11px] text-on-surface-variant"><p>FILE: {document.original_filename} · {formatSize(document.file_size_bytes)}</p><p className="mt-[8px]">UPLOADED BY {document.uploaded_by_name} · {new Date(document.created_at).toLocaleDateString()}</p></div>
    {canDelete && <button className="mt-[16px] border border-danger/60 px-[14px] py-[10px] font-data-mono text-[11px] text-danger hover:bg-danger/10" type="button" onClick={() => void onDelete(document.id)}>DELETE</button>}
  </article>;
}
