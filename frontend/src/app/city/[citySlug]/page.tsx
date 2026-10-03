"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AssetCard } from "@/components/infrastructure/AssetCard";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { City, getCities } from "@/services/cities";
import { getInfrastructureAssets, InfrastructureAsset } from "@/services/infrastructure";
import { getProjects, Project } from "@/services/projects";

export default function CityBrowsePage() {
  const params = useParams<{ citySlug: string }>();
  const slug = params.citySlug;
  const [city, setCity] = useState<City | null>(null);
  const [view, setView] = useState<"projects" | "infrastructure">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCities()
      .then((records) => setCity(records.find((record) => record.slug === slug) ?? null))
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Unable to load city.")
      );
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    const load =
      view === "projects"
        ? getProjects({ city: slug }).then(setProjects)
        : getInfrastructureAssets({ city: slug }).then(setAssets);
    load
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Unable to load city records.")
      )
      .finally(() => setLoading(false));
  }, [slug, view]);

  const items = view === "projects" ? projects : assets;

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar />
      <main className="flex-1 px-[24px] py-[32px]">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-wrap items-start justify-between gap-[16px]">
            <div>
              <p className="font-label-caps text-label-caps tracking-widest text-primary">
                CITY BROWSER
              </p>
              <h1 className="mt-[8px] font-display-md text-display-md">
                {city?.name ?? "City"}
              </h1>
            </div>
            <div className="glass-card flex gap-[4px] rounded-xl p-[4px]">
              <button
                className={`px-[14px] py-[10px] font-data-mono text-[11px] ${
                  view === "projects"
                    ? "border border-primary-container/60 text-primary"
                    : "text-on-surface-variant"
                }`}
                onClick={() => setView("projects")}
                type="button"
              >
                PROJECTS
              </button>
              <button
                className={`px-[14px] py-[10px] font-data-mono text-[11px] ${
                  view === "infrastructure"
                    ? "border border-primary-container/60 text-primary"
                    : "text-on-surface-variant"
                }`}
                onClick={() => setView("infrastructure")}
                type="button"
              >
                INFRASTRUCTURE
              </button>
            </div>
          </header>
          {error ? (
            <p className="mt-[24px] text-danger">{error}</p>
          ) : loading ? (
            <p className="mt-[24px] font-data-mono text-[12px] text-on-surface-variant">
              LOADING {view.toUpperCase()}...
            </p>
          ) : !city ? (
            <p className="glass-card mt-[24px] rounded-xl p-[24px] text-on-surface-variant">
              This city is not currently supported. Please choose another city.
            </p>
          ) : !items.length ? (
            <div className="glass-card mt-[24px] rounded-xl p-[24px]">
              <h2 className="font-display-md text-[22px]">No {view} yet</h2>
              <p className="mt-[8px] text-sm text-on-surface-variant">
                There are no {view} recorded for {city.name}.
              </p>
            </div>
          ) : (
            <div className="mt-[24px] grid gap-[16px] md:grid-cols-2 xl:grid-cols-3">
              {view === "projects"
                ? projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                : assets.map((asset) => <AssetCard key={asset.id} asset={asset} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
