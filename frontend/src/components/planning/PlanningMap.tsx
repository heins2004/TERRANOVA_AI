"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import { useAuth } from "@/components/layout/auth-provider";
import { CandidateSitePanel } from "@/components/planning/CandidateSitePanel";
import OsmReferenceLayerManager, { ActiveOsmLayers } from "@/components/maps/OsmReferenceLayerManager";
import {
  CandidateSite,
  CandidateSitePayload,
  createCandidateSite,
  createStudyArea,
  GeoJSONPoint,
  GeoJSONPolygon,
  getCandidateSites,
  getStudyAreas,
  StudyArea,
} from "@/services/studyAreas";

const defaultCenter: [number, number] = [20.5937, 78.9629];

type Basemap = "dark" | "satellite";

const BASEMAPS: Record<Basemap, { url: string; attribution: string }> = {
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

const LABEL_LAYERS: Record<Basemap, string> = {
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
};

function candidateSiteMarkerIcon(suitability: string, isSelected: boolean) {
  const color =
    suitability === "Suitable"
      ? "#34d399"
      : suitability === "Unsuitable"
      ? "#f87171"
      : "#22d3ee";

  return L.divIcon({
    className: "terranova-candidate-marker",
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
        <span style="
          display:block;
          width:${isSelected ? "18px" : "14px"};
          height:${isSelected ? "18px" : "14px"};
          border-radius:9999px;
          border:2px solid #0a0e17;
          background:${color};
          box-shadow:0 0 ${isSelected ? "18px" : "10px"} ${color};
          transition:all 0.2s ease;
        "></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function pendingMarkerIcon() {
  return L.divIcon({
    className: "terranova-pending-marker",
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
        <span style="
          display:block;
          width:16px;
          height:16px;
          border-radius:9999px;
          border:3px solid #ffffff;
          background:#8aebff;
          box-shadow:0 0 16px #8aebff;
          animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        "></span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function GeomanControls({
  isEditor,
  onPolygonCreated,
}: {
  isEditor: boolean;
  onPolygonCreated: (geoJson: GeoJSONPolygon, layer: L.Layer) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    (window as unknown as { __planningMap?: L.Map }).__planningMap = map;
    const pm = (map as unknown as { pm?: { addControls: (opts: unknown) => void; removeControls: () => void } }).pm;
    if (!pm) return;

    if (isEditor) {
      pm.addControls({
        position: "topleft",
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawCircle: false,
        drawText: false,
        cutPolygon: false,
        rotateMode: false,
        drawPolygon: true,
        editMode: false,
        dragMode: false,
        removalMode: false,
      });

      const handleCreate = (e: { shape?: string; layer?: L.Layer & { toGeoJSON?: () => { geometry?: GeoJSONPolygon } } }) => {
        if (e.layer && typeof e.layer.toGeoJSON === "function") {
          const feature = e.layer.toGeoJSON();
          if (feature && feature.geometry && feature.geometry.type === "Polygon") {
            onPolygonCreated(feature.geometry, e.layer);
          }
        }
      };

      map.on("pm:create", handleCreate as unknown as L.LeafletEventHandlerFn);

      return () => {
        map.off("pm:create", handleCreate as unknown as L.LeafletEventHandlerFn);
        try {
          pm.removeControls();
        } catch {
          // Ignore
        }
      };
    } else {
      try {
        pm.removeControls();
      } catch {
        // Ignore
      }
    }
  }, [map, isEditor, onPolygonCreated]);

  return null;
}

function MapClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick: (latlng: L.LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

function MapBoundsController({
  targetArea,
}: {
  targetArea: StudyArea | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!targetArea) return;
    try {
      const layer = L.geoJSON({
        type: "Feature",
        properties: {},
        geometry: targetArea.boundary,
      } as unknown as GeoJSON.GeoJsonObject);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    } catch (err) {
      console.error("Failed to fit map bounds:", err);
    }
  }, [map, targetArea]);

  return null;
}

const PERMITTED_ROLES = ["Urban Planner", "Government Official", "Administrator"];

export function PlanningMap() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isEditor = Boolean(user && PERMITTED_ROLES.includes(user.role));

  // All hooks must be declared before any conditional return (Rules of Hooks).
  const [activeBasemap, setActiveBasemap] = useState<Basemap>("dark");
  const [activeOsmLayers, setActiveOsmLayers] = useState<ActiveOsmLayers>({
    road: false,
    school: false,
    hospital: false,
  });
  const [isOsmLoading, setIsOsmLoading] = useState(false);
  const [isTooZoomedOut, setIsTooZoomedOut] = useState(false);
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<StudyArea | null>(null);
  const [candidateSites, setCandidateSites] = useState<CandidateSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Polygon Creation State
  const [pendingPolygon, setPendingPolygon] = useState<GeoJSONPolygon | null>(null);
  const pendingPolygonLayerRef = useRef<L.Layer | null>(null);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaCity, setNewAreaCity] = useState("");
  const [isSavingArea, setIsSavingArea] = useState(false);

  // Candidate Site Creation State
  const [isAddingCandidateSite, setIsAddingCandidateSite] = useState(false);
  const [pendingSiteLocation, setPendingSiteLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteAreaSize, setNewSiteAreaSize] = useState("");
  const [newSiteLandUse, setNewSiteLandUse] = useState("Mixed Use");
  const [newSiteOwnership, setNewSiteOwnership] = useState("Government");
  const [newSiteNotes, setNewSiteNotes] = useState("");
  const [isSavingSite, setIsSavingSite] = useState(false);

  // Role gate: redirect Citizens (and any non-editor) as soon as auth state is known.
  // The proxy only checks session existence — it cannot read the role from the cookie.
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    if (!isReady || hasRedirectedRef.current) return;
    if (!user || !PERMITTED_ROLES.includes(user.role)) {
      hasRedirectedRef.current = true;
      router.replace("/");
    }
  }, [isReady, user, router]);

  // Load Study Areas
  const refreshStudyAreas = useCallback(async () => {
    try {
      setError("");
      const areas = await getStudyAreas();
      setStudyAreas(areas);
      return areas;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load study areas.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStudyAreas();
  }, [refreshStudyAreas]);

  // Load Candidate Sites when an area is selected
  useEffect(() => {
    if (!selectedArea) {
      setCandidateSites([]);
      setSelectedSite(null);
      setIsAddingCandidateSite(false);
      setPendingSiteLocation(null);
      return;
    }

    let isMounted = true;
    getCandidateSites(selectedArea.id)
      .then((sites) => {
        if (isMounted) {
          setCandidateSites(sites);
          setSelectedSite(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load candidate sites.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedArea]);

  // Open panel when a site is selected
  useEffect(() => {
    if (selectedSite) {
      setIsPanelOpen(true);
    }
  }, [selectedSite]);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedSite(null);
  }, []);

  const handleSiteUpdated = useCallback((updated: CandidateSite) => {
    setCandidateSites((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
  }, []);

  // Handle Geoman polygon creation
  const handlePolygonCreated = useCallback((geoJson: GeoJSONPolygon, layer: L.Layer) => {
    pendingPolygonLayerRef.current = layer;
    setPendingPolygon(geoJson);
    setNewAreaName("");
    setNewAreaCity("");
    setActionNotice("Study area shape captured. Provide a name to save it.");
  }, []);

  const handleDiscardPolygon = () => {
    if (pendingPolygonLayerRef.current) {
      try {
        pendingPolygonLayerRef.current.remove();
      } catch {
        // Ignore
      }
      pendingPolygonLayerRef.current = null;
    }
    setPendingPolygon(null);
    setNewAreaName("");
    setNewAreaCity("");
    setActionNotice("");
  };

  const handleSaveStudyArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPolygon || !newAreaName.trim()) {
      setError("Please provide a name for the study area.");
      return;
    }

    try {
      setIsSavingArea(true);
      setError("");
      const savedArea = await createStudyArea({
        name: newAreaName.trim(),
        city: newAreaCity.trim() || null,
        boundary: pendingPolygon,
      });

      // Remove the temporary layer from drawing
      if (pendingPolygonLayerRef.current) {
        try {
          pendingPolygonLayerRef.current.remove();
        } catch {
          // Ignore
        }
        pendingPolygonLayerRef.current = null;
      }
      setPendingPolygon(null);
      setNewAreaName("");
      setNewAreaCity("");
      setActionNotice(`Study area "${savedArea.name}" saved successfully!`);

      // Refresh and select new area
      const refreshed = await refreshStudyAreas();
      const match = refreshed.find((a) => a.id === savedArea.id) ?? savedArea;
      setSelectedArea(match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save study area.");
    } finally {
      setIsSavingArea(false);
    }
  };

  // Handle click on map to add candidate site
  const handleMapClickForCandidateSite = (latlng: L.LatLng) => {
    setPendingSiteLocation({ lat: latlng.lat, lng: latlng.lng });
    setNewSiteName("");
    setNewSiteAreaSize("");
    setNewSiteLandUse("Mixed Use");
    setNewSiteOwnership("Government");
    setNewSiteNotes("");
    setActionNotice(`Candidate site location selected at ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}.`);
  };

  const handleDiscardPendingSite = () => {
    setPendingSiteLocation(null);
    setIsAddingCandidateSite(false);
    setActionNotice("");
  };

  const handleSaveCandidateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !pendingSiteLocation || !newSiteName.trim()) {
      setError("Please provide a name for the candidate site.");
      return;
    }

    try {
      setIsSavingSite(true);
      setError("");

      // Explicit [longitude, latitude] GeoJSON conversion
      const location: GeoJSONPoint = {
        type: "Point",
        coordinates: [pendingSiteLocation.lng, pendingSiteLocation.lat],
      };

      const payload: CandidateSitePayload = {
        name: newSiteName.trim(),
        location,
        area_size_acres: newSiteAreaSize ? parseFloat(newSiteAreaSize) : null,
        land_use: newSiteLandUse || null,
        ownership_type: newSiteOwnership || "Unknown",
        notes: newSiteNotes.trim() || null,
      };

      const saved = await createCandidateSite(selectedArea.id, payload);
      setCandidateSites((prev) => [...prev, saved]);
      setSelectedSite(saved);
      setPendingSiteLocation(null);
      setIsAddingCandidateSite(false);
      setActionNotice(`Candidate site "${saved.name}" added to "${selectedArea.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save candidate site.");
    } finally {
      setIsSavingSite(false);
    }
  };

  // Calculate map center based on selected area or first area
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedArea && selectedArea.boundary.coordinates?.[0]?.[0]) {
      const firstCoord = selectedArea.boundary.coordinates[0][0];
      return [firstCoord[1], firstCoord[0]]; // [lat, lng] from GeoJSON [lng, lat]
    }
    if (studyAreas.length > 0 && studyAreas[0].boundary.coordinates?.[0]?.[0]) {
      const firstCoord = studyAreas[0].boundary.coordinates[0][0];
      return [firstCoord[1], firstCoord[0]];
    }
    return defaultCenter;
  }, [selectedArea, studyAreas]);

  // Guard render — all hooks above have fired unconditionally, so this early
  // return is safe. isReady=false shows a loading screen; wrong role shows the
  // redirect message while the useEffect fires router.replace("/").
  if (!isReady || !user || !PERMITTED_ROLES.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center font-data-mono text-sm text-on-surface-variant">
        {!isReady ? "AUTHENTICATING..." : "ACCESS RESTRICTED — REDIRECTING..."}
      </div>
    );
  }

  return (
    <div className="planning-workspace-map relative h-full w-full overflow-hidden">
      <style>{`
        .planning-workspace-map .leaflet-top.leaflet-left {
          top: 92px !important;
          z-index: 1001 !important;
        }
        @media (max-width: 640px) {
          .planning-workspace-map .leaflet-top.leaflet-left {
            top: 112px !important;
          }
        }
        .planning-workspace-map .leaflet-bottom.leaflet-left {
          z-index: 1001 !important;
        }
      `}</style>
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
        zoom={selectedArea ? 13 : 5}
      >
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution={BASEMAPS[activeBasemap].attribution}
          url={BASEMAPS[activeBasemap].url}
        />
        <TileLayer url={LABEL_LAYERS[activeBasemap]} />

        {/* Geoman Drawing Controller */}
        <GeomanControls
          isEditor={isEditor}
          onPolygonCreated={handlePolygonCreated}
        />

        {/* Click-to-add handler for candidate sites */}
        <MapClickHandler
          enabled={isAddingCandidateSite && !pendingSiteLocation}
          onMapClick={handleMapClickForCandidateSite}
        />

        {/* Smooth zoom to selected study area */}
        <MapBoundsController targetArea={selectedArea} />

        {/* Render Study Area Polygons */}
        {studyAreas.map((area) => {
          const isSelected = selectedArea?.id === area.id;
          return (
            <GeoJSON
              key={`study-area-${area.id}-${isSelected ? "selected" : "idle"}`}
              data={{
                type: "Feature",
                properties: { id: area.id, name: area.name },
                geometry: area.boundary,
              } as unknown as GeoJSON.GeoJsonObject}
              style={{
                color: isSelected ? "#8aebff" : "#22d3ee",
                weight: isSelected ? 3 : 2,
                fillColor: isSelected ? "#22d3ee" : "#0ea5b8",
                fillOpacity: isSelected ? 0.32 : 0.14,
                dashArray: isSelected ? undefined : "3, 6",
              }}
              eventHandlers={{
                click: (e) => {
                  if (isAddingCandidateSite && !pendingSiteLocation) {
                    handleMapClickForCandidateSite(e.latlng);
                  } else {
                    L.DomEvent.stopPropagation(e as unknown as Event);
                    setSelectedArea(area);
                  }
                },
              }}
            />
          );
        })}

        {/* Render Candidate Site Point Markers */}
        {selectedArea &&
          candidateSites.map((site) => {
            // Location is GeoJSON Point: [longitude, latitude]
            const position: [number, number] = [
              site.location.coordinates[1],
              site.location.coordinates[0],
            ];
            const isSiteSelected = selectedSite?.id === site.id;

            return (
              <Marker
                icon={candidateSiteMarkerIcon(site.suitability_status, isSiteSelected)}
                key={`candidate-site-${site.id}`}
                position={position}
                eventHandlers={{
                  click: () => setSelectedSite(site),
                }}
              />
            );
          })}

        {/* Render Pending Marker when picking location */}
        {pendingSiteLocation && (
          <Marker
            icon={pendingMarkerIcon()}
            position={[pendingSiteLocation.lat, pendingSiteLocation.lng]}
          />
        )}

        <OsmReferenceLayerManager
          activeLayers={activeOsmLayers}
          onLoadingChange={setIsOsmLoading}
          onZoomWarningChange={setIsTooZoomedOut}
        />
      </MapContainer>

      {/* Top Header Floating Bar */}
      <header className="glass-card absolute top-[16px] left-[16px] right-[16px] z-[1000] flex items-center justify-between rounded-[16px] px-[20px] py-[12px] md:left-[24px] md:right-[24px]">
          <div>
            <h1 className="font-display-md text-[18px] font-semibold tracking-wide text-foreground">
              Planning Workspace
            </h1>
            <p className="font-data-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Study Areas &bull; Candidate Sites Identification
            </p>
          </div>

        <div className="flex items-center gap-[12px]">
          {user ? (
            <span className="rounded-full border border-primary-container/40 bg-primary-container/10 px-[12px] py-[4px] font-data-mono text-[11px] text-primary">
              {user.role}
            </span>
          ) : (
            <span className="rounded-full border border-white/20 bg-white/5 px-[12px] py-[4px] font-data-mono text-[11px] text-on-surface-variant">
              Guest (View Only)
            </span>
          )}
          <Link
            className="hidden font-data-mono text-[11px] text-on-surface-variant transition hover:text-foreground sm:inline-block"
            href="/map"
          >
            GIS VIEW &rarr;
          </Link>
        </div>
      </header>

      {/* Left Sidebar: Study Areas & Candidate Sites */}
      <aside className="glass-card absolute top-[84px] left-[16px] z-[1000] flex max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-100px)] w-[360px] flex-col rounded-[20px] p-[20px] shadow-2xl md:left-[24px]">
        {/* Header / Mode Indicator */}
        <div className="flex items-center justify-between pb-[12px] border-b border-white/10">
          <div>
            <p className="font-label-caps text-label-caps tracking-widest text-primary">
              {selectedArea ? "SELECTED STUDY AREA" : "STUDY AREAS"}
            </p>
            <p className="font-data-mono text-[11px] text-on-surface-variant">
              {selectedArea
                ? `${candidateSites.length} candidate sites identified`
                : `${studyAreas.length} total areas`}
            </p>
          </div>

          {selectedArea && (
            <button
              className="rounded-md border border-white/20 bg-white/5 px-[10px] py-[4px] font-data-mono text-[10px] uppercase text-on-surface-variant transition hover:border-primary-container hover:text-primary"
              onClick={() => {
                setSelectedArea(null);
                setSelectedSite(null);
                setIsAddingCandidateSite(false);
                setPendingSiteLocation(null);
              }}
              type="button"
            >
              All Areas
            </button>
          )}
        </div>

        {/* Action Controls for Editors */}
        {isEditor && (
          <div className="mt-[14px] flex flex-col gap-[8px]">
            {!selectedArea ? (
              <div className="rounded-[12px] border border-primary-container/30 bg-primary-container/10 p-[12px]">
                <p className="font-data-mono text-[11px] text-primary">
                  &bull; Use the polygon tool on the top-left of the map to draw a new Study Area.
                </p>
              </div>
            ) : (
              <button
                className={`w-full rounded-[12px] border py-[10px] px-[16px] text-center font-data-mono text-[12px] font-medium tracking-wide uppercase transition ${
                  isAddingCandidateSite
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_16px_#8aebff]"
                    : "border-primary-container/60 bg-primary-container/20 text-primary hover:bg-primary-container/30"
                }`}
                onClick={() => {
                  setIsAddingCandidateSite((prev) => !prev);
                  setPendingSiteLocation(null);
                  if (!isAddingCandidateSite) {
                    setActionNotice("Click anywhere inside the study area on the map to place a candidate site.");
                  } else {
                    setActionNotice("");
                  }
                }}
                type="button"
              >
                {isAddingCandidateSite ? "\u2715 Cancel Placement" : "+ Add Candidate Site"}
              </button>
            )}
          </div>
        )}

        {/* Notifications / Feedback */}
        {actionNotice && (
          <div className="mt-[12px] rounded-[10px] border border-primary-container/40 bg-primary-container/10 p-[10px] font-data-mono text-[11px] text-primary">
            {actionNotice}
          </div>
        )}

        {error && (
          <div className="mt-[12px] rounded-[10px] border border-danger/40 bg-danger/10 p-[10px] font-data-mono text-[11px] text-danger">
            {error}
          </div>
        )}

        {/* Content Section: List or Detail */}
        <div className="mt-[14px] flex-1 overflow-y-auto pr-[4px] space-y-[10px]">
          {loading ? (
            <p className="py-[20px] text-center font-data-mono text-[11px] text-on-surface-variant">
              LOADING STUDY AREAS...
            </p>
          ) : !selectedArea ? (
            // Study Areas List
            studyAreas.length === 0 ? (
              <div className="py-[24px] text-center font-data-mono text-[12px] text-on-surface-variant">
                NO STUDY AREAS DEFINED YET.
                {isEditor && (
                  <p className="mt-[8px] text-[11px] text-primary">
                    Use the map drawing tool on the top-left to define the first study area.
                  </p>
                )}
              </div>
            ) : (
              studyAreas.map((area) => (
                <div
                  className="cursor-pointer rounded-[14px] border border-white/10 bg-white/5 p-[14px] transition hover:border-primary-container/60 hover:bg-white/10"
                  key={`area-card-${area.id}`}
                  onClick={() => setSelectedArea(area)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-display-md text-[14px] font-medium text-foreground">
                      {area.name}
                    </h3>
                    {area.city && (
                      <span className="rounded-md border border-white/15 px-[6px] py-[2px] font-data-mono text-[9px] uppercase text-muted-foreground">
                        {area.city}
                      </span>
                    )}
                  </div>
                  <p className="mt-[6px] font-data-mono text-[10px] text-on-surface-variant">
                    Created {new Date(area.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )
          ) : (
            // Selected Area Candidate Sites View
            <div>
              <div className="rounded-[14px] border border-primary-container/30 bg-primary-container/10 p-[14px]">
                <h2 className="font-display-md text-[16px] font-semibold text-foreground">
                  {selectedArea.name}
                </h2>
                {selectedArea.city && (
                  <p className="mt-[2px] font-data-mono text-[11px] text-primary">
                    City: {selectedArea.city}
                  </p>
                )}
                <p className="mt-[6px] font-data-mono text-[10px] text-on-surface-variant">
                  Created {new Date(selectedArea.created_at).toLocaleString()}
                </p>
              </div>

              <div className="mt-[16px]">
                <p className="font-label-caps text-label-caps tracking-wider text-muted-foreground">
                  CANDIDATE SITES ({candidateSites.length})
                </p>

                {candidateSites.length === 0 ? (
                  <div className="mt-[10px] rounded-[12px] border border-white/10 bg-surface-container-lowest/50 p-[16px] text-center font-data-mono text-[11px] text-on-surface-variant">
                    No candidate sites identified in this study area yet.
                    {isEditor && (
                      <p className="mt-[6px] text-primary">
                        Click &ldquo;+ Add Candidate Site&rdquo; above to place one on the map.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-[10px] space-y-[8px]">
                    {candidateSites.map((site) => {
                      const isSiteActive = selectedSite?.id === site.id;
                      return (
                        <div
                          className={`cursor-pointer rounded-[12px] border p-[12px] transition ${
                            isSiteActive
                              ? "border-primary bg-primary-container/20 shadow-md"
                              : "border-white/10 bg-white/5 hover:border-primary-container/40"
                          }`}
                          key={`site-card-${site.id}`}
                          onClick={() => setSelectedSite(site)}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-display-md text-[13px] font-medium text-foreground">
                              {site.name}
                            </h4>
                            <span className="rounded-full border border-primary-container/30 bg-primary-container/10 px-[6px] py-[1px] font-data-mono text-[9px] text-primary">
                              {site.suitability_status}
                            </span>
                          </div>

                          <div className="mt-[6px] flex flex-wrap gap-[6px] font-data-mono text-[10px] text-on-surface-variant">
                            <span>{site.area_size_acres ? `${site.area_size_acres} ac` : "Acres n/a"}</span>
                            <span>&bull;</span>
                            <span>{site.land_use ?? "Land use n/a"}</span>
                            <span>&bull;</span>
                            <span>{site.ownership_type}</span>
                          </div>

                          {site.notes && (
                            <p className="mt-[6px] text-[11px] text-muted-foreground line-clamp-2">
                              {site.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Save Study Area Form (Triggered after Geoman pm:create) */}
      {pendingPolygon && (
        <div className="glass-card absolute bottom-[24px] left-[16px] z-[1100] w-[360px] rounded-[20px] p-[20px] shadow-2xl md:left-[24px]">
          <div className="flex items-center justify-between pb-[10px] border-b border-white/10">
            <h3 className="font-display-md text-[15px] font-semibold text-foreground">
              Save Study Area
            </h3>
            <span className="rounded-full border border-primary-container/40 bg-primary-container/10 px-[8px] py-[2px] font-data-mono text-[10px] text-primary">
              Polygon Captured
            </span>
          </div>

          <form className="mt-[14px] space-y-[12px]" onSubmit={handleSaveStudyArea}>
            <div>
              <label className="block font-data-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Study Area Name *
              </label>
              <input
                className="field-shell mt-[6px] w-full rounded-[10px] px-[12px] py-[8px] font-body-md text-[13px] text-foreground focus:outline-none"
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="e.g., North Tech Corridor"
                required
                type="text"
                value={newAreaName}
              />
            </div>

            <div>
              <label className="block font-data-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                City (Optional)
              </label>
              <input
                className="field-shell mt-[6px] w-full rounded-[10px] px-[12px] py-[8px] font-body-md text-[13px] text-foreground focus:outline-none"
                onChange={(e) => setNewAreaCity(e.target.value)}
                placeholder="e.g., Bengaluru"
                type="text"
                value={newAreaCity}
              />
            </div>

            <div className="flex gap-[10px] pt-[6px]">
              <button
                className="flex-1 rounded-[10px] border border-primary bg-primary py-[8px] font-data-mono text-[11px] uppercase text-primary-foreground font-semibold transition hover:opacity-90 disabled:opacity-50"
                disabled={isSavingArea}
                type="submit"
              >
                {isSavingArea ? "Saving..." : "Save Area"}
              </button>
              <button
                className="rounded-[10px] border border-white/20 bg-white/5 px-[14px] py-[8px] font-data-mono text-[11px] uppercase text-on-surface-variant transition hover:bg-white/10"
                disabled={isSavingArea}
                onClick={handleDiscardPolygon}
                type="button"
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Add Candidate Site Form (Triggered after clicking on map) */}
      {pendingSiteLocation && selectedArea && (
        <div className="glass-card absolute bottom-[24px] right-[16px] z-[1100] w-[380px] rounded-[20px] p-[20px] shadow-2xl md:right-[24px]">
          <div className="flex items-center justify-between pb-[10px] border-b border-white/10">
            <h3 className="font-display-md text-[15px] font-semibold text-foreground">
              New Candidate Site
            </h3>
            <span className="rounded-full border border-primary-container/40 bg-primary-container/10 px-[8px] py-[2px] font-data-mono text-[10px] text-primary">
              {selectedArea.name}
            </span>
          </div>

          <p className="mt-[8px] font-data-mono text-[10px] text-on-surface-variant">
            Coords: {pendingSiteLocation.lat.toFixed(5)}, {pendingSiteLocation.lng.toFixed(5)}
          </p>

          <form className="mt-[12px] space-y-[12px]" onSubmit={handleSaveCandidateSite}>
            <div>
              <label className="block font-data-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Site Name *
              </label>
              <input
                className="field-shell mt-[4px] w-full rounded-[10px] px-[12px] py-[8px] font-body-md text-[13px] text-foreground focus:outline-none"
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="e.g., Riverside Parcel B"
                required
                type="text"
                value={newSiteName}
              />
            </div>

            <div className="grid grid-cols-2 gap-[10px]">
              <div>
                <label className="block font-data-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Area (Acres)
                </label>
                <input
                  className="field-shell mt-[4px] w-full rounded-[10px] px-[12px] py-[8px] font-body-md text-[13px] text-foreground focus:outline-none"
                  min="0"
                  onChange={(e) => setNewSiteAreaSize(e.target.value)}
                  placeholder="e.g., 14.5"
                  step="0.01"
                  type="number"
                  value={newSiteAreaSize}
                />
              </div>

              <div>
                <label className="block font-data-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Ownership
                </label>
                <select
                  className="field-shell mt-[4px] w-full rounded-[10px] px-[12px] py-[8px] font-body-md text-[13px] text-foreground focus:outline-none"
                  onChange={(e) => setNewSiteOwnership(e.target.value)}
                  value={newSiteOwnership}
                >
                  <option value="Government">Government</option>
                  <option value="Private">Private</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-data-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Land Use
              </label>
              <input
                className="field-shell mt-[4px] w-full rounded-[10px] px-[12px] py-[8px] font-body-md text-[13px] text-foreground focus:outline-none"
                onChange={(e) => setNewSiteLandUse(e.target.value)}
                placeholder="e.g., Mixed Use, Industrial"
                type="text"
                value={newSiteLandUse}
              />
            </div>

            <div>
              <label className="block font-data-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Planning Notes (Optional)
              </label>
              <textarea
                className="field-shell mt-[4px] w-full rounded-[10px] px-[12px] py-[8px] font-body-md text-[12px] text-foreground focus:outline-none"
                onChange={(e) => setNewSiteNotes(e.target.value)}
                placeholder="Initial reconnaissance observations..."
                rows={2}
                value={newSiteNotes}
              />
            </div>

            <div className="rounded-[8px] border border-white/10 bg-white/5 p-[8px] font-data-mono text-[10px] text-on-surface-variant">
              &bull; Default statuses applied: Suitability = RequiresReview, Availability = VerificationRequired, Flood Risk = Unknown.
            </div>

            <div className="flex gap-[10px] pt-[4px]">
              <button
                className="flex-1 rounded-[10px] border border-primary bg-primary py-[8px] font-data-mono text-[11px] uppercase text-primary-foreground font-semibold transition hover:opacity-90 disabled:opacity-50"
                disabled={isSavingSite}
                type="submit"
              >
                {isSavingSite ? "Saving..." : "Save Candidate Site"}
              </button>
              <button
                className="rounded-[10px] border border-white/20 bg-white/5 px-[14px] py-[8px] font-data-mono text-[11px] uppercase text-on-surface-variant transition hover:bg-white/10"
                disabled={isSavingSite}
                onClick={handleDiscardPendingSite}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Basemap Switcher & Reference Layers */}
      <aside className="glass-card absolute bottom-[24px] right-[16px] z-[1000] w-[200px] rounded-[14px] p-[12px] md:right-[24px]">
        <p className="font-label-caps text-label-caps tracking-widest text-primary">BASEMAP</p>
        <div className="mt-[8px] grid grid-cols-2 gap-[4px] rounded-lg border border-white/10 bg-surface-container-lowest/80 p-[3px]">
          <button
            className={`rounded-md py-[5px] text-center font-data-mono text-[10px] uppercase transition-all ${
              activeBasemap === "dark"
                ? "border border-primary-container/50 bg-primary-container/20 font-medium text-primary shadow-sm"
                : "border border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setActiveBasemap("dark")}
            type="button"
          >
            Dark
          </button>
          <button
            className={`rounded-md py-[5px] text-center font-data-mono text-[10px] uppercase transition-all ${
              activeBasemap === "satellite"
                ? "border border-primary-container/50 bg-primary-container/20 font-medium text-primary shadow-sm"
                : "border border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setActiveBasemap("satellite")}
            type="button"
          >
            Satellite
          </button>
        </div>

        <div className="mt-[12px] pt-[10px] border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="font-label-caps text-label-caps tracking-widest text-primary">REFERENCE (OSM)</p>
            {isOsmLoading && (
              <span className="font-data-mono text-[9px] text-primary animate-pulse">FETCHING...</span>
            )}
          </div>
          <div className="mt-[8px] flex flex-col gap-[6px]">
            <button
              type="button"
              onClick={() => setActiveOsmLayers((prev) => ({ ...prev, road: !prev.road }))}
              className={`flex items-center justify-between rounded-lg border px-[10px] py-[6px] font-data-mono text-[10px] transition-all ${
                activeOsmLayers.road
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-400 font-medium shadow-sm"
                  : "border-white/10 bg-surface-container-lowest/80 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-[6px]">
                <span className="h-[7px] w-[7px] rounded-full bg-sky-400" />
                ROADS
              </span>
              <span>{activeOsmLayers.road ? "ON" : "OFF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOsmLayers((prev) => ({ ...prev, school: !prev.school }))}
              className={`flex items-center justify-between rounded-lg border px-[10px] py-[6px] font-data-mono text-[10px] transition-all ${
                activeOsmLayers.school
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-medium shadow-sm"
                  : "border-white/10 bg-surface-container-lowest/80 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-[6px]">
                <span className="h-[7px] w-[7px] rounded-full bg-emerald-400" />
                SCHOOLS
              </span>
              <span>{activeOsmLayers.school ? "ON" : "OFF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOsmLayers((prev) => ({ ...prev, hospital: !prev.hospital }))}
              className={`flex items-center justify-between rounded-lg border px-[10px] py-[6px] font-data-mono text-[10px] transition-all ${
                activeOsmLayers.hospital
                  ? "border-rose-500/60 bg-rose-500/10 text-rose-400 font-medium shadow-sm"
                  : "border-white/10 bg-surface-container-lowest/80 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-[6px]">
                <span className="h-[7px] w-[7px] rounded-full bg-rose-400" />
                HOSPITALS
              </span>
              <span>{activeOsmLayers.hospital ? "ON" : "OFF"}</span>
            </button>
          </div>
          {isTooZoomedOut && (activeOsmLayers.road || activeOsmLayers.school || activeOsmLayers.hospital) && (
            <p className="mt-[6px] font-data-mono text-[9px] text-amber-400/90 leading-tight">
              Zoom in (zoom &ge; 13) to load reference features.
            </p>
          )}
        </div>
      </aside>

      {/* Candidate Site Detail Panel */}
      {isPanelOpen && selectedSite && (
        <CandidateSitePanel
          site={selectedSite}
          isEditor={isEditor}
          onClose={handleClosePanel}
          onSiteUpdated={handleSiteUpdated}
        />
      )}
    </div>
  );
}
