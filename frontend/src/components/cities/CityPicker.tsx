"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { City, getCities } from "@/services/cities";

type PhotonFeature = { properties: { name?: string; state?: string; country?: string; countrycode?: string }; geometry: { coordinates: [number, number] } };
type PhotonResponse = { features?: PhotonFeature[] };

const CityPickerMap = dynamic(() => import("@/components/maps/CityPickerMap").then((module) => module.CityPickerMap), { ssr: false, loading: () => <div className="flex h-full items-center justify-center font-data-mono text-[12px] text-on-surface-variant">LOADING CITY MAP...</div> });

function placeLabel(feature: PhotonFeature) {
  return [feature.properties.name, feature.properties.state, feature.properties.country].filter(Boolean).join(", ");
}

export function CityPicker() {
  const router = useRouter(); const { isAuthenticated, isReady } = useAuth();
  const [cities, setCities] = useState<City[]>([]); const [query, setQuery] = useState(""); const [results, setResults] = useState<PhotonFeature[]>([]); const [cityError, setCityError] = useState(""); const [searchError, setSearchError] = useState(""); const [unsupportedPlace, setUnsupportedPlace] = useState("");

  useEffect(() => { getCities().then(setCities).catch((caught) => setCityError(caught instanceof Error ? caught.message : "Unable to load supported cities.")); }, []);
  useEffect(() => {
    const trimmedQuery = query.trim();
    setUnsupportedPlace("");
    setSearchError("");
    if (trimmedQuery.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedQuery)}&limit=8`, { signal: controller.signal });
        if (!response.ok) throw new Error("Photon search failed.");
        const payload = await response.json() as PhotonResponse;
        const features = (payload.features ?? []).filter((feature) => feature.properties.name);
        setResults([...features.filter((feature) => feature.properties.countrycode?.toUpperCase() === "IN"), ...features.filter((feature) => feature.properties.countrycode?.toUpperCase() !== "IN")]);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setResults([]); setSearchError("Search unavailable right now.");
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const selectCity = (slug: string) => router.push(`/city/${slug}`);
  function selectPlace(feature: PhotonFeature) {
    const name = feature.properties.name ?? "this place";
    const matchingCity = cities.find((city) => city.name.toLowerCase() === name.toLowerCase());
    if (matchingCity) { selectCity(matchingCity.slug); return; }
    setUnsupportedPlace(name); setResults([]);
  }

  return <main className="min-h-screen bg-surface-container-lowest px-[24px] py-[24px] text-on-surface"><div className="mx-auto max-w-7xl"><header className="glass-card flex flex-wrap items-center justify-between gap-[16px] rounded-xl p-[20px]"><div><p className="font-label-caps text-label-caps tracking-widest text-primary">TERRANOVA AI</p><p className="mt-[6px] text-sm text-on-surface-variant">Explore planning activity by city</p></div><nav className="flex items-center gap-[12px]">{isReady && (isAuthenticated ? <Link className="border border-primary-container/60 px-[14px] py-[10px] font-data-mono text-[11px] text-primary" href="/dashboard">DASHBOARD</Link> : <><Link className="border border-white/15 px-[14px] py-[10px] font-data-mono text-[11px] text-on-surface-variant" href="/login">LOGIN</Link><Link className="border border-primary-container/60 px-[14px] py-[10px] font-data-mono text-[11px] text-primary" href="/register">REGISTER</Link></>)}</nav></header><section className="mt-[24px] grid gap-[24px] lg:grid-cols-[340px_1fr]"><aside className="glass-card rounded-xl p-[20px]"><h1 className="font-display-md text-[30px] text-on-surface">Find a place</h1><label className="mt-[20px] block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Search anywhere<input className="mt-[8px] w-full border border-white/15 bg-surface-container-lowest/70 px-[12px] py-[10px] text-sm text-on-surface" placeholder="Search cities and places" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="mt-[16px] flex flex-col gap-[8px]">{results.map((feature, index) => <button className="glass-card block w-full rounded-xl p-[14px] text-left transition hover:border-primary-container/60" key={`${feature.properties.name}-${feature.geometry.coordinates.join("-")}-${index}`} onClick={() => selectPlace(feature)} type="button"><p className="text-sm font-semibold text-on-surface">{feature.properties.name}</p><p className="mt-[4px] text-[12px] text-on-surface-variant">{placeLabel(feature)}</p></button>)}{query.trim().length >= 2 && !results.length && !searchError && !unsupportedPlace && <p className="font-data-mono text-[11px] text-on-surface-variant">NO PLACES FOUND.</p>}{searchError && <p className="font-data-mono text-[11px] text-danger">{searchError}</p>}{cityError && <p className="font-data-mono text-[11px] text-danger">{cityError}</p>}{unsupportedPlace && <div className="glass-card rounded-xl p-[14px]"><p className="text-sm leading-6 text-on-surface-variant">TerraNova AI doesn&apos;t have planning data for {unsupportedPlace} yet. Try one of the supported cities below.</p><div className="mt-[12px] flex flex-col gap-[8px]">{cities.map((city) => <button className="block w-full border border-white/10 px-[12px] py-[10px] text-left text-[12px] text-primary transition hover:border-primary-container/60" key={city.slug} onClick={() => selectCity(city.slug)} type="button">{city.name}</button>)}</div></div>}</div></aside><section className="glass-card h-[580px] overflow-hidden rounded-xl"><CityPickerMap cities={cities} onSelect={selectCity} /></section></section></div></main>;
}
