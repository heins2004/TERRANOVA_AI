"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AssetCard } from "@/components/infrastructure/AssetCard";
import { AssetForm } from "@/components/infrastructure/AssetForm";
import { useAuth } from "@/components/layout/auth-provider";
import { InfrastructureAsset, InfrastructureAssetPayload, createInfrastructureAsset, getInfrastructureAssets } from "@/services/infrastructure";
import { Project, getProjects } from "@/services/projects";

const editorRoles = ["Urban Planner", "Government Official", "Administrator"];
export default function InfrastructurePage() {
  const { user } = useAuth(); const [assets, setAssets] = useState<InfrastructureAsset[]>([]); const [projects, setProjects] = useState<Project[]>([]); const [condition, setCondition] = useState(""); const [showCreate, setShowCreate] = useState(false); const [error, setError] = useState(""); const canEdit = Boolean(user && editorRoles.includes(user.role));
  function load() { getInfrastructureAssets({ condition }).then(setAssets).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load infrastructure.")); }
  useEffect(() => { load(); }, [condition]); useEffect(() => { getProjects().then(setProjects).catch(() => undefined); }, []);
  async function submit(payload: InfrastructureAssetPayload) { const asset = await createInfrastructureAsset(payload); setAssets((current) => [asset, ...current]); setShowCreate(false); }
  return <main className="min-h-screen bg-surface-container-lowest px-[24px] py-[32px] text-on-surface"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap justify-between gap-[16px]"><div><p className="font-label-caps text-label-caps tracking-widest text-primary">CITY SYSTEMS REGISTER</p><h1 className="mt-[8px] font-display-md text-display-md">Infrastructure</h1></div><div className="flex gap-[12px]">{canEdit && <button className="border border-primary-container/60 px-[14px] py-[10px] font-data-mono text-[11px] text-primary hover:bg-primary-container/10" type="button" onClick={() => setShowCreate((current) => !current)}>{showCreate ? "CLOSE FORM" : "CREATE ASSET"}</button>}<Link className="border border-white/15 px-[14px] py-[10px] font-data-mono text-[11px] text-on-surface-variant" href="/dashboard">DASHBOARD</Link></div></div>{canEdit && showCreate && <div className="mt-[24px]"><AssetForm projects={projects} onSubmit={submit} /></div>}<select className="mt-[24px] border border-white/15 bg-surface-bright/20 px-[12px] py-[10px] text-sm" value={condition} onChange={(event) => setCondition(event.target.value)}><option value="">All conditions</option>{["Good", "Fair", "Poor", "Critical"].map((option) => <option key={option}>{option}</option>)}</select>{error ? <p className="mt-[24px] text-danger">{error}</p> : <div className="mt-[24px] grid gap-[16px] md:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => <AssetCard asset={asset} key={asset.id} />)}{!assets.length && <p className="font-data-mono text-sm text-on-surface-variant">NO INFRASTRUCTURE ASSETS MATCH THIS FILTER.</p>}</div>}</div></main>;
}
