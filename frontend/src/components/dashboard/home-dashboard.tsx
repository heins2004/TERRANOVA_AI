"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoutButton } from "@/components/ui/logout-button";
import { AuthUser } from "@/lib/auth";
import { getUsers } from "@/services/admin";
import { Complaint, getComplaints } from "@/services/complaints";
import { getConsultations } from "@/services/consultations";
import { getDocuments } from "@/services/documents";
import { getInfrastructureAssets, InfrastructureAsset } from "@/services/infrastructure";
import { getProjects, Project } from "@/services/projects";

type HomeDashboardProps = { user: AuthUser };
type DashboardData = { projects: Project[]; assets: InfrastructureAsset[]; complaints: Complaint[]; upcomingConsultations: number; documentCount?: number; userCount?: number };

const staffRoles = ["Urban Planner", "Government Official", "Administrator"];
const needsAttention = (status: string) => status === "Submitted" || status === "UnderReview";

export function HomeDashboard({ user }: HomeDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const isStaff = staffRoles.includes(user.role);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");
        const [projects, assets, complaints, consultations, documents, users] = await Promise.all([
          getProjects(), getInfrastructureAssets(), getComplaints(), getConsultations(),
          isStaff ? getDocuments() : Promise.resolve(undefined),
          user.role === "Administrator" ? getUsers() : Promise.resolve(undefined),
        ]);
        setData({ projects, assets, complaints, upcomingConsultations: consultations.filter((consultation) => consultation.status === "Upcoming").length, documentCount: documents?.length, userCount: users?.length });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load dashboard data.");
      }
    }
    void loadDashboard();
  }, [isStaff, user.role]);

  const recentProjects = useMemo(() => data?.projects.slice().sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()).slice(0, 3) ?? [], [data]);
  const navigation = [{ label: "Dashboard Overview", href: "/dashboard" }, { label: "Projects", href: "/projects" }, { label: "Infrastructure", href: "/infrastructure" }, { label: "GIS Workspace", href: "/map" }, { label: "Complaints", href: "/complaints" }, { label: "Documents", href: "/documents" }, { label: "Consultations", href: "/consultations" }, ...(user.role === "Administrator" ? [{ label: "Admin", href: "/admin" }] : []), { label: "Browse by City", href: "/" }];
  const baseTiles = data ? [{ label: "Total projects", value: data.projects.length }, { label: "Assets needing attention", value: data.assets.filter((asset) => asset.condition === "Poor" || asset.condition === "Critical").length }, { label: "Upcoming consultations", value: data.upcomingConsultations }] : [];
  const roleTiles = data ? user.role === "Citizen" ? [{ label: "My complaints", value: data.complaints.length }, { label: "Complaints in progress", value: data.complaints.filter((complaint) => needsAttention(complaint.status)).length }] : [{ label: "Complaints needing attention", value: data.complaints.filter((complaint) => needsAttention(complaint.status)).length }, { label: "Documents uploaded", value: data.documentCount ?? 0 }, ...(user.role === "Administrator" ? [{ label: "Total users", value: data.userCount ?? 0 }] : [])] : [];

  return <main className="min-h-screen bg-background"><div className="mx-auto flex min-h-screen max-w-7xl flex-col px-[24px] py-[24px] lg:flex-row lg:gap-[24px] lg:px-[32px]"><aside className="hero-panel rounded-[32px] px-[24px] py-[32px] text-primary-foreground lg:w-[320px] lg:px-[28px]"><div className="flex items-start justify-between gap-[16px]"><div><p className="text-[12px] uppercase tracking-[0.32em] text-white/72">TERRANOVA AI</p><h1 className="mt-[12px] text-[30px] font-semibold leading-tight">Urban Planning Command Center</h1></div><LogoutButton /></div><div className="mt-[40px] rounded-[28px] border border-white/16 bg-white/10 p-[20px]"><p className="text-sm text-white/72">Signed in as</p><p className="mt-[8px] text-[20px] font-semibold">{user.full_name}</p><p className="mt-[4px] text-sm text-white/78">{user.email}</p><p className="mt-[8px] text-[12px] uppercase tracking-[0.24em] text-white/62">Role: {user.role}</p></div><nav className="mt-[40px] flex flex-col gap-[12px]">{navigation.map((item) => <Link className="block w-full rounded-[16px] border border-white/12 bg-white/8 px-[16px] py-[12px] text-sm text-white/86 transition hover:border-primary-container/40 hover:bg-white/12" href={item.href} key={item.label}>{item.label}</Link>)}</nav></aside><section className="mt-[24px] flex-1 lg:mt-[0px]"><div className="flex flex-col gap-[24px]"><article className="glass-card rounded-[32px] p-[24px] sm:p-[32px]"><p className="text-sm font-medium uppercase tracking-[0.28em] text-secondary">Welcome</p><h2 className="mt-[12px] text-[30px] font-semibold text-foreground">Welcome back, {user.full_name}.</h2><p className="mt-[16px] max-w-3xl text-base leading-8 text-muted-foreground">Your {user.role.toLowerCase()} workspace is connected to the latest planning, infrastructure, and community activity.</p></article>{error ? <article className="glass-card rounded-[28px] p-[24px]"><p className="text-danger">{error}</p></article> : !data ? <article className="glass-card rounded-[28px] p-[24px]"><p className="font-data-mono text-[12px] text-on-surface-variant">LOADING LIVE DASHBOARD DATA...</p></article> : <><section className="grid gap-[16px] md:grid-cols-2 xl:grid-cols-4">{[...baseTiles, ...roleTiles].map((tile) => <article className="glass-card rounded-[28px] p-[20px]" key={tile.label}><p className="text-sm text-muted-foreground">{tile.label}</p><p className="mt-[12px] text-[36px] font-semibold text-foreground">{tile.value}</p></article>)}</section><section className="grid gap-[24px] xl:grid-cols-[1.2fr_0.8fr]"><article className="glass-card rounded-[32px] p-[24px] sm:p-[32px]"><h3 className="text-[22px] font-semibold text-foreground">Recent Activity</h3><p className="mt-[8px] text-sm text-muted-foreground">The latest projects added to TERRANOVA AI.</p><div className="mt-[20px] flex flex-col gap-[12px]">{recentProjects.map((project) => <Link className="block w-full rounded-[16px] border border-white/10 px-[16px] py-[14px] transition hover:border-primary-container/60" href={`/projects/${project.id}`} key={project.id}><p className="text-sm font-semibold text-foreground">{project.title}</p><p className="mt-[4px] font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{project.status} · {project.category ?? "General planning"}</p></Link>)}{!recentProjects.length && <p className="font-data-mono text-[12px] text-on-surface-variant">NO PROJECTS HAVE BEEN CREATED YET.</p>}</div></article><article className="glass-card rounded-[32px] p-[24px]"><h3 className="text-[22px] font-semibold text-foreground">Working Links</h3><div className="mt-[20px] flex flex-col gap-[12px]">{user.role === "Citizen" && <Link className="block w-full border border-primary-container/60 px-[16px] py-[12px] text-sm font-semibold text-primary transition hover:bg-primary-container/10" href="/">BROWSE PROJECTS BY CITY</Link>}{user.role === "Administrator" && <Link className="block w-full border border-primary-container/60 px-[16px] py-[12px] text-sm font-semibold text-primary transition hover:bg-primary-container/10" href="/admin">OPEN ADMINISTRATION</Link>}<Link className="block w-full border border-white/15 px-[16px] py-[12px] text-sm text-on-surface-variant transition hover:border-primary-container/60" href="/projects">OPEN PROJECTS</Link><Link className="block w-full border border-white/15 px-[16px] py-[12px] text-sm text-on-surface-variant transition hover:border-primary-container/60" href="/map">OPEN GIS WORKSPACE</Link></div></article></section></>}</div></section></div></main>;
}
