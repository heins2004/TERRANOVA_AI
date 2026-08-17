import Link from "next/link";
import { Project } from "@/services/projects";
import { StatusBadge } from "./StatusBadge";

export function ProjectCard({ project }: { project: Project }) {
  return <article className="glass-card rounded-xl p-[24px] transition hover:border-primary-container/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"><div className="flex items-start justify-between gap-[16px]"><div><p className="font-data-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">{project.category ?? "General planning"}</p><h2 className="mt-[8px] font-display-md text-[22px] text-on-surface">{project.title}</h2></div><StatusBadge status={project.status} /></div><p className="mt-[16px] line-clamp-2 text-sm leading-6 text-on-surface-variant">{project.description ?? "No project description has been recorded."}</p><div className="mt-[20px] flex items-center justify-between border-t border-white/10 pt-[16px] font-data-mono text-[11px] text-on-surface-variant"><span>{project.budget ? `Budget: ${project.budget}` : "Budget pending"}</span><Link className="text-primary transition hover:text-primary-container" href={`/projects/${project.id}`}>VIEW RECORD →</Link></div></article>;
}
