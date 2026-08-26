"use client";

import { FormEvent, useState } from "react";
import { DocumentUploadPayload } from "@/services/documents";
import { Project } from "@/services/projects";

export function DocumentUploadForm({ projects, onSubmit }: { projects: Project[]; onSubmit: (payload: DocumentUploadPayload) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) { setError("Select a document to upload."); return; }
    setSaving(true); setError("");
    try {
      await onSubmit({ title, description, category, project_id: projectId, file });
      setTitle(""); setDescription(""); setCategory(""); setProjectId(""); setFile(null);
      const input = document.getElementById("planning-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to upload document."); }
    finally { setSaving(false); }
  }

  return <form className="glass-card rounded-xl p-[24px]" onSubmit={submit}>
    <h2 className="font-display-md text-[22px] text-on-surface">Upload planning document</h2>
    <div className="mt-[20px] grid gap-[16px] md:grid-cols-2">
      <Field label="Title" required value={title} onChange={setTitle} />
      <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Category<input className="mt-[8px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" placeholder="e.g. Zoning" value={category} onChange={(event) => setCategory(event.target.value)} /></label>
      <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Related project (optional)<select className="mt-[8px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">No related project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
      <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">File<input accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg" className="mt-[8px] block w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface file:mr-[12px] file:border-0 file:bg-transparent file:font-data-mono file:text-[11px] file:text-primary" id="planning-document-file" required type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
    </div>
    <label className="mt-[16px] block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Description<textarea className="mt-[8px] min-h-[100px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
    <p className="mt-[12px] font-data-mono text-[11px] text-on-surface-variant">PDF, DOCX, XLSX, PNG, or JPG · maximum 20 MB</p>
    {error && <p className="mt-[12px] text-sm text-danger">{error}</p>}
    <button className="mt-[20px] border border-primary-container/60 px-[16px] py-[10px] font-label-caps text-label-caps tracking-widest text-primary transition hover:bg-primary-container/10 disabled:opacity-60" disabled={saving} type="submit">{saving ? "UPLOADING..." : "UPLOAD DOCUMENT"}</button>
  </form>;
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{label}<input className="mt-[8px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
