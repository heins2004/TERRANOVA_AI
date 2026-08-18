"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplaintCard } from "@/components/citizen/ComplaintCard";
import { ComplaintForm } from "@/components/citizen/ComplaintForm";
import { useAuth } from "@/components/layout/auth-provider";
import { Complaint, ComplaintPayload, ComplaintStatus, createComplaint, getComplaints, updateComplaintStatus } from "@/services/complaints";
import { Project, getProjects } from "@/services/projects";

const editorRoles = ["Urban Planner", "Government Official", "Administrator"];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const canUpdate = user ? editorRoles.includes(user.role) : false;

  async function loadComplaints() { try { setError(""); setComplaints(await getComplaints()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load complaints."); } }
  useEffect(() => { void loadComplaints(); getProjects().then(setProjects).catch(() => undefined); }, []);
  async function submit(payload: ComplaintPayload) { const complaint = await createComplaint(payload); setComplaints((current) => [complaint, ...current]); }
  async function changeStatus(id: number, status: ComplaintStatus) { try { const complaint = await updateComplaintStatus(id, status); setComplaints((current) => current.map((item) => item.id === id ? complaint : item)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update complaint status."); } }

  return <main className="min-h-screen bg-surface-container-lowest px-[24px] py-[32px] text-on-surface"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-[16px]"><div><p className="font-label-caps text-label-caps tracking-widest text-primary">CITIZEN SERVICES</p><h1 className="mt-[8px] font-display-md text-display-md">Complaints &amp; Feedback</h1><p className="mt-[8px] text-sm text-on-surface-variant">Submit an issue or review feedback received from the community.</p></div><Link className="border border-white/15 px-[14px] py-[10px] font-data-mono text-[11px] text-on-surface-variant hover:border-primary-container/50" href="/dashboard">DASHBOARD</Link></div><div className="mt-[24px]"><ComplaintForm projects={projects} onSubmit={submit} /></div>{error && <p className="mt-[24px] text-danger">{error}</p>}<section className="mt-[32px]"><h2 className="font-display-md text-[26px]">Submitted complaints</h2><div className="mt-[16px] grid gap-[16px] md:grid-cols-2">{complaints.map((complaint) => <ComplaintCard canUpdate={canUpdate} complaint={complaint} key={complaint.id} onStatusChange={changeStatus} />)}{!error && !complaints.length && <p className="font-data-mono text-sm text-on-surface-variant">NO COMPLAINTS HAVE BEEN SUBMITTED.</p>}</div></section></div></main>;
}
