"use client";

import { FormEvent, useState } from "react";
import { ComplaintPayload } from "@/services/complaints";
import { Project } from "@/services/projects";

export function ComplaintForm({ projects, onSubmit, initialProjectId }: { projects: Project[]; onSubmit: (payload: ComplaintPayload) => Promise<void>; initialProjectId?: number }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      await onSubmit({ subject, description, project_id: projectId ? Number(projectId) : null });
      setSubject(""); setDescription(""); setProjectId(initialProjectId?.toString() ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit complaint.");
    } finally { setSaving(false); }
  }

  return <form className="glass-card rounded-xl p-[24px]" onSubmit={submit}>
    <h2 className="font-display-md text-[22px] text-on-surface">Submit feedback</h2>
    <div className="mt-[20px] grid gap-[16px] md:grid-cols-2">
      <Field label="Subject" required value={subject} onChange={setSubject} />
      <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Related project (optional)<select className="mt-[8px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">No related project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
    </div>
    <label className="mt-[16px] block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Description<textarea className="mt-[8px] min-h-[120px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" required value={description} onChange={(event) => setDescription(event.target.value)} /></label>
    {error && <p className="mt-[12px] text-sm text-danger">{error}</p>}
    <button className="mt-[20px] border border-primary-container/60 px-[16px] py-[10px] font-label-caps text-label-caps tracking-widest text-primary transition hover:bg-primary-container/10 disabled:opacity-60" disabled={saving} type="submit">{saving ? "SUBMITTING..." : "SUBMIT COMPLAINT"}</button>
  </form>;
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{label}<input className="mt-[8px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
