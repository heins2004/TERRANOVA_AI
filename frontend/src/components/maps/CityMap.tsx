"use client";

import Link from "next/link";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { conditionClasses, conditionMarkerColors } from "@/components/infrastructure/ConditionBadge";
import { projectStatusClasses, projectStatusMarkerColors } from "@/components/projects/StatusBadge";
import { getInfrastructureAssets, InfrastructureAsset } from "@/services/infrastructure";
import { getProjects, Project } from "@/services/projects";

const cityCenter: [number, number] = [20.5937, 78.9629];

function markerIcon(color: string, kind: "project" | "asset") {
  return L.divIcon({
    className: "terranova-map-marker",
    html: `<span class="terranova-map-marker__dot terranova-map-marker__dot--${kind}" style="--marker-color:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function hasCoordinates(item: { location_lat: number | null; location_lng: number | null }) {
  return item.location_lat !== null && item.location_lng !== null;
}

export function CityMap() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [showProjects, setShowProjects] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getProjects(), getInfrastructureAssets()])
      .then(([projectRecords, assetRecords]) => { setProjects(projectRecords); setAssets(assetRecords); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load map records."));
  }, []);

  const locatedProjects = useMemo(() => projects.filter(hasCoordinates), [projects]);
  const locatedAssets = useMemo(() => assets.filter(hasCoordinates), [assets]);
  const mapCenter = locatedProjects[0] ?? locatedAssets[0];
  const center: [number, number] = mapCenter ? [mapCenter.location_lat!, mapCenter.location_lng!] : cityCenter;

  return <div className="relative h-full w-full">
    <MapContainer center={center} className="h-full w-full" scrollWheelZoom zoom={mapCenter ? 13 : 5}>
      <TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {showProjects && locatedProjects.map((project) => <Marker icon={markerIcon(projectStatusMarkerColors[project.status] ?? projectStatusMarkerColors.Proposed, "project")} key={`project-${project.id}`} position={[project.location_lat!, project.location_lng!]}><Popup><div className="terranova-popup"><p className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Project</p><p className="mt-[4px] font-display-md text-[18px] text-on-surface">{project.title}</p><span className={`mt-[10px] inline-block rounded-full border px-[8px] py-[3px] font-data-mono text-[10px] uppercase ${projectStatusClasses[project.status] ?? projectStatusClasses.Proposed}`}>{project.status}</span><Link className="mt-[14px] block font-data-mono text-[11px] text-primary" href={`/projects/${project.id}`}>OPEN PROJECT →</Link></div></Popup></Marker>)}
      {showAssets && locatedAssets.map((asset) => <Marker icon={markerIcon(conditionMarkerColors[asset.condition] ?? conditionMarkerColors.Good, "asset")} key={`asset-${asset.id}`} position={[asset.location_lat!, asset.location_lng!]}><Popup><div className="terranova-popup"><p className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Infrastructure</p><p className="mt-[4px] font-display-md text-[18px] text-on-surface">{asset.name}</p><span className={`mt-[10px] inline-block rounded-full border px-[8px] py-[3px] font-data-mono text-[10px] uppercase ${conditionClasses[asset.condition] ?? conditionClasses.Good}`}>{asset.condition}</span>{asset.project_id && <Link className="mt-[14px] block font-data-mono text-[11px] text-primary" href={`/projects/${asset.project_id}`}>OPEN LINKED PROJECT →</Link>}</div></Popup></Marker>)}
    </MapContainer>
    <aside className="glass-card absolute top-[24px] right-[24px] z-[1000] w-[220px] rounded-xl p-[16px]"><p className="font-label-caps text-label-caps tracking-widest text-primary">MAP LAYERS</p><div className="mt-[14px] flex flex-col gap-[10px]"><button className={`block w-full border px-[12px] py-[10px] text-left font-data-mono text-[11px] ${showProjects ? "border-primary-container/60 text-primary" : "border-white/15 text-on-surface-variant"}`} onClick={() => setShowProjects((current) => !current)} type="button">{showProjects ? "✓" : "○"} PROJECTS ({locatedProjects.length})</button><button className={`block w-full border px-[12px] py-[10px] text-left font-data-mono text-[11px] ${showAssets ? "border-primary-container/60 text-primary" : "border-white/15 text-on-surface-variant"}`} onClick={() => setShowAssets((current) => !current)} type="button">{showAssets ? "✓" : "○"} INFRASTRUCTURE ({locatedAssets.length})</button></div>{error ? <p className="mt-[12px] font-data-mono text-[11px] text-danger">{error}</p> : !locatedProjects.length && !locatedAssets.length ? <p className="mt-[12px] font-data-mono text-[11px] leading-5 text-on-surface-variant">NO RECORDS WITH COORDINATES YET.</p> : null}</aside>
  </div>;
}
