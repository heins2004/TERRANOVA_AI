"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import {
  PublicProject,
  getProject,
  listProjects,
} from "@/services/publicProjects";
import {
  getMyFollows,
  followProject,
  unfollowProject,
} from "@/services/follows";
import { TopBar } from "@/components/layout/TopBar";
import { HomeSearchRow } from "./HomeSearchRow";
import { ProjectCard } from "./ProjectCard";
import { ProjectPanel } from "./ProjectPanel";
import { ParticleCloak } from "./ParticleCloak";

const CATEGORIES = [
  "All",
  "Road",
  "Hospital",
  "School",
  "Stadium",
  "Mall",
  "Park",
] as const;

type ProjectCategoryOption = (typeof CATEGORIES)[number];

const INDIA_OUTLINE: [number, number][] = [
  [74, 37],
  [77, 35.5],
  [79, 34],
  [78, 32.5],
  [80, 30.5],
  [84, 28.5],
  [88, 27.5],
  [89, 26.7],
  [92, 27],
  [95, 28.5],
  [97, 28],
  [95, 26],
  [94, 24],
  [93, 22],
  [91, 24.5],
  [89, 25],
  [88.5, 22.5],
  [87, 21.5],
  [85, 19.5],
  [83, 17.5],
  [80.3, 15.5],
  [80.2, 13],
  [79.8, 10.5],
  [78.2, 8.7],
  [77.5, 8],
  [76.5, 9],
  [75.5, 11.5],
  [74.8, 13.5],
  [73.8, 16],
  [72.8, 19],
  [72.9, 21],
  [70.5, 21],
  [69, 22.3],
  [68.2, 23.7],
  [70, 24.5],
  [71, 25.5],
  [70.5, 28],
  [72, 29.5],
  [74, 31],
  [74.5, 33],
  [73.5, 34.5],
];

export function PublicHome() {
  const { user, isAuthenticated } = useAuth();
  const searchInputId = useId();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ProjectCategoryOption>("All");
  const [selectedSort, setSelectedSort] = useState<"talk" | "new" | "soon">(
    "talk"
  );
  const [isPast, setIsPast] = useState(false);

  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(
    null
  );
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const cardAnimsDataRef = useRef<
    { element: HTMLElement; dx: number; dy: number }[]
  >([]);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [inFlightFollowIds, setInFlightFollowIds] = useState<Set<number>>(
    new Set()
  );
  const [followError, setFollowError] = useState<string | null>(null);

  // Load follows once when authenticated user is present; clear on logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFollowedIds(new Set());
      return;
    }

    const ac = new AbortController();
    getMyFollows(ac.signal)
      .then((res) => {
        setFollowedIds(new Set(res.project_ids));
      })
      .catch((err) => {
        if (err.message === "not logged in") {
          router.push("/login");
        }
      });

    return () => ac.abort();
  }, [isAuthenticated, user, router]);

  // Auto-dismiss follow error after 4s
  useEffect(() => {
    if (followError) {
      const timer = setTimeout(() => setFollowError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [followError]);

  // Deep link: open project panel if query parameter ?project={id} is present
  useEffect(() => {
    const handleDeepLink = (e?: Event) => {
      if (typeof window === "undefined") return;
      let targetId: number | null = null;
      if (e && "detail" in e && typeof (e as CustomEvent).detail === "number") {
        targetId = (e as CustomEvent).detail;
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const param = urlParams.get("project");
        if (param) targetId = parseInt(param, 10);
      }
      if (targetId && !isNaN(targetId)) {
        getProject(targetId).then((proj) => setSelectedProject(proj)).catch(() => {});
      }
    };

    handleDeepLink();
    window.addEventListener("deep-link-project", handleDeepLink);
    return () => window.removeEventListener("deep-link-project", handleDeepLink);
  }, []);

  const handleToggleFollow = useCallback(
    async (projectId: number) => {
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }

      if (inFlightFollowIds.has(projectId)) {
        return;
      }

      const wasFollowed = followedIds.has(projectId);

      // Optimistic update
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (wasFollowed) {
          next.delete(projectId);
        } else {
          next.add(projectId);
        }
        return next;
      });

      setInFlightFollowIds((prev) => new Set(prev).add(projectId));
      setFollowError(null);

      try {
        if (wasFollowed) {
          await unfollowProject(projectId);
        } else {
          await followProject(projectId);
        }
      } catch (err: any) {
        if (err.message === "not logged in") {
          router.push("/login");
          return;
        }
        // Roll back on failure
        setFollowedIds((prev) => {
          const next = new Set(prev);
          if (wasFollowed) {
            next.add(projectId);
          } else {
            next.delete(projectId);
          }
          return next;
        });
        setFollowError("Could not update follow. Try again.");
      } finally {
        setInFlightFollowIds((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }
    },
    [isAuthenticated, user, router, followedIds, inFlightFollowIds]
  );

  // 300ms debounce for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      const cleaned = searchInput.trim().replace(/\s+/g, " ").slice(0, 80);
      setDebouncedQ(cleaned);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch projects with AbortController
  const fetchProjects = useCallback(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    listProjects(
      {
        q: debouncedQ || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        past: isPast,
        sort: selectedSort,
        limit: 24,
        offset: 0,
      },
      controller.signal
    )
      .then((res) => {
        setProjects(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(
            "Could not load projects. Check your connection and try again."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
  }, [debouncedQ, selectedCategory, isPast, selectedSort]);

  useEffect(() => {
    fetchProjects();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchProjects]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || projects.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await listProjects({
        q: debouncedQ || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        past: isPast,
        sort: selectedSort,
        limit: 24,
        offset: projects.length,
      });
      setProjects((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch {
      // keep current projects
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    projects.length,
    total,
    debouncedQ,
    selectedCategory,
    isPast,
    selectedSort,
  ]);

  // SVG points for India decorative map outline
  const indiaPolygonPoints = useMemo(() => {
    return INDIA_OUTLINE.map(([lng, lat]) =>
      [
        ((lng - 68) * 13 + 20).toFixed(1),
        ((37.5 - lat) * 13 + 10).toFixed(1),
      ].join(",")
    ).join(" ");
  }, []);

  // Summary counts
  const openCount = useMemo(
    () => projects.filter((p) => p.stage === "OpenForResponse").length,
    [projects]
  );
  const cityCount = useMemo(
    () =>
      new Set(
        projects.map((p) => p.city_name || p.city).filter((c): c is string => Boolean(c))
      ).size,
    [projects]
  );
  const totalParticipation = useMemo(
    () => projects.reduce((sum, p) => sum + (p.participants || 0), 0),
    [projects]
  );

  // Card fly animation & open panel
  const handleSelectProject = (
    project: PublicProject,
    cardElem: HTMLElement
  ) => {
    triggerElementRef.current = cardElem;
    setSelectedProject(project);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!prefersReducedMotion && gridContainerRef.current) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const cards = Array.from(
        gridContainerRef.current.querySelectorAll<HTMLElement>(
          ".project-card, .map-card"
        )
      );

      cardAnimsDataRef.current = [];
      cards.forEach((c) => {
        if (c === cardElem) return;
        const b = c.getBoundingClientRect();
        const dx = (b.left + b.width / 2 - cx) * 0.9;
        const dy = (b.top + b.height / 2 - cy) * 0.9;
        c.style.pointerEvents = "none";
        c.animate(
          [
            {
              transform: "translate3d(0px, 0px, 0px) rotateY(0deg)",
              opacity: 1,
            },
            {
              transform: `translate3d(${dx}px, ${dy}px, 900px) rotateY(${
                dx / 60
              }deg)`,
              opacity: 0,
            },
          ],
          {
            duration: 1200,
            easing: "cubic-bezier(0.45, 0, 0.2, 1)",
            fill: "forwards",
          }
        );
        cardAnimsDataRef.current.push({ element: c, dx, dy });
      });
    }
  };

  const handleStartClose = useCallback(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!prefersReducedMotion) {
      cardAnimsDataRef.current.forEach(({ element: c, dx, dy }) => {
        c.animate(
          [
            {
              transform: `translate3d(${dx}px, ${dy}px, 900px) rotateY(${
                dx / 60
              }deg)`,
              opacity: 0,
            },
            {
              transform: "translate3d(0px, 0px, 0px) rotateY(0deg)",
              opacity: 1,
            },
          ],
          {
            duration: 900,
            easing: "cubic-bezier(0.65, 0, 0.2, 1)",
            fill: "forwards",
          }
        );
      });
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    // Release cards
    if (gridContainerRef.current) {
      const cards = Array.from(
        gridContainerRef.current.querySelectorAll<HTMLElement>(
          ".project-card, .map-card"
        )
      );
      cards.forEach((c) => {
        c.getAnimations().forEach((a) => a.cancel());
        c.style.transform = "";
        c.style.opacity = "";
        c.style.pointerEvents = "";
      });
    }
    cardAnimsDataRef.current = [];

    if (triggerElementRef.current) {
      triggerElementRef.current.style.visibility = "";
      triggerElementRef.current.focus();
    }

    setSelectedProject(null);

    // Ensure focus remains on triggering card after DOM update
    requestAnimationFrame(() => {
      if (triggerElementRef.current) {
        triggerElementRef.current.style.visibility = "";
        triggerElementRef.current.focus();
      }
    });
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-surface-container-lowest text-on-surface overflow-x-hidden">
      {/* Particle Cloak Background */}
      <ParticleCloak />

      {/* Shared Top Navigation */}
      <TopBar />

      {/* Search Bar & Theme Toggle */}
      <HomeSearchRow
        searchInputId={searchInputId}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
      />

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-[1596px] px-[16px] pb-[48px] sm:px-[32px] lg:px-[48px]">
        {/* Title */}
        <h1 className="mt-[12px] font-body-md text-[26px] sm:text-[34px] font-light text-on-surface tracking-tight">
          Public projects across India
        </h1>

        {/* Global summary strip */}
        <div className="mt-[6px] mb-[18px] flex flex-wrap gap-x-[22px] gap-y-[6px] font-body-md text-[13px] text-on-surface-variant">
          <span>
            <b className="font-data-mono font-bold text-on-surface">
              {total}
            </b>{" "}
            projects
          </span>
          <span>
            <b className="font-data-mono font-bold text-on-surface">
              {openCount}
            </b>{" "}
            open for response
          </span>
          <span>
            <b className="font-data-mono font-bold text-on-surface">
              {cityCount}
            </b>{" "}
            cities
          </span>
          <span>
            <b className="font-data-mono font-bold text-on-surface">
              {totalParticipation.toLocaleString("en-IN")}
            </b>{" "}
            people have taken part
          </span>
        </div>

        {/* Filter Toolbar: Category Chips, Sort, and Status Segments */}
        <div className="mb-[20px] flex flex-wrap items-center gap-[8px]">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-[6px]">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-[14px] py-[6px] font-body-md text-[13px] transition-all focus-visible:outline-none ${
                    isActive
                      ? "border-primary-container bg-primary-container/20 text-primary-container font-medium"
                      : "border-white/15 bg-white/5 text-on-surface-variant hover:border-white/30 hover:text-on-surface"
                  }`}
                >
                  {cat === "All" ? "All types" : cat}
                </button>
              );
            })}
          </div>

          {/* Sort Select */}
          <div className="flex items-center">
            <select
              id="so"
              value={selectedSort}
              onChange={(e) =>
                setSelectedSort(e.target.value as "talk" | "new" | "soon")
              }
              aria-label="Sort projects"
              className="rounded-full border border-white/15 bg-white/5 px-[14px] py-[7px] font-body-md text-[13px] text-on-surface focus-visible:outline-none focus-visible:border-primary-container"
            >
              <option
                value="talk"
                className="bg-surface-container-lowest text-on-surface"
              >
                Most discussed
              </option>
              <option
                value="new"
                className="bg-surface-container-lowest text-on-surface"
              >
                Newest
              </option>
              <option
                value="soon"
                className="bg-surface-container-lowest text-on-surface"
              >
                Closing soon
              </option>
            </select>
          </div>

          {/* Segmented Switch: Open now vs Past projects */}
          <div className="ml-auto flex items-center gap-[4px] rounded-full border border-white/15 bg-white/5 p-[2px]">
            <button
              type="button"
              aria-pressed={!isPast}
              onClick={() => setIsPast(false)}
              className={`rounded-full px-[14px] py-[5px] font-body-md text-[13px] transition-all ${
                !isPast
                  ? "border border-primary-container/60 bg-primary-container/20 text-primary-container font-medium"
                  : "border border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Open now
            </button>
            <button
              type="button"
              aria-pressed={isPast}
              onClick={() => setIsPast(true)}
              className={`rounded-full px-[14px] py-[5px] font-body-md text-[13px] transition-all ${
                isPast
                  ? "border border-primary-container/60 bg-primary-container/20 text-primary-container font-medium"
                  : "border border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Past projects
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div
          ref={gridContainerRef}
          style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] [perspective:1400px] [transform-style:preserve-3d]"
        >
          {/* Big Map Card (The ONLY link to /map) */}
          <Link
            href="/map"
            aria-label="Open interactive map of India"
            className="map-card group relative col-span-1 sm:col-span-2 row-span-1 sm:row-span-2 flex min-h-[300px] sm:min-h-[400px] flex-col justify-end overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-[22px] backdrop-blur-[20px] transition-all duration-300 hover:border-primary-container/60 hover:shadow-[0_0_30px_-6px_rgba(34,211,238,0.4)] hover:scale-[1.01] focus-visible:border-primary-container focus-visible:outline-none"
          >
            {/* Decorative SVG Map of India */}
            <svg
              viewBox="0 0 420 430"
              role="img"
              aria-label="Decorative schematic map of India"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-60 transition-opacity duration-300 group-hover:opacity-85"
            >
              <polygon
                points={indiaPolygonPoints}
                className="fill-primary-container/10 stroke-primary-container/40"
                strokeWidth="1.5"
              />
              {/* Project coordinate markers from loaded projects */}
              {projects
                .filter(
                  (p) => p.location_lat != null && p.location_lng != null
                )
                .map((p) => {
                  const x = ((p.location_lng! - 68) * 13 + 20).toFixed(1);
                  const y = ((37.5 - p.location_lat!) * 13 + 10).toFixed(1);
                  return (
                    <g key={p.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        className="fill-primary-container transition-all group-hover:r-5"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="9"
                        fill="none"
                        className="stroke-primary-container/40"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
            </svg>

            <span className="absolute top-[14px] left-[14px] z-10 rounded-full border border-white/15 bg-surface-container-lowest/80 px-[10px] py-[3px] font-body-md text-[11px] text-primary-container font-medium">
              Map
            </span>

            <div className="relative z-10 flex flex-col gap-[4px]">
              <h3 className="font-body-md text-[20px] sm:text-[22px] font-bold text-on-surface group-hover:text-primary transition-colors">
                India map
              </h3>
              <p className="font-body-md text-[13px] text-on-surface-variant max-w-md">
                {total} project{total === 1 ? "" : "s"} shown. Open the
                interactive map to inspect sites and spatial telemetry.
              </p>
            </div>
          </Link>

          {/* Error State with Retry Button */}
          {error && (
            <div className="col-span-full rounded-[16px] border border-danger/40 bg-danger/10 p-[36px] text-center font-body-md text-on-surface">
              <p className="text-danger font-medium mb-[12px]">
                {error}
              </p>
              <button
                type="button"
                onClick={fetchProjects}
                className="rounded-full border border-danger/60 bg-danger/20 px-[20px] py-[8px] font-body-md text-[13px] text-on-surface hover:bg-danger/30 transition-colors focus-visible:outline-none"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading &&
            projects.length === 0 &&
            [...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[16px] border border-white/10 bg-white/5 p-[16px] animate-pulse"
              >
                <div className="h-[20px] w-[60px] rounded-full bg-white/10 mb-auto" />
                <div className="h-[20px] w-3/4 rounded bg-white/10 mb-[8px]" />
                <div className="h-[14px] w-1/2 rounded bg-white/10 mb-[12px]" />
                <div className="h-[6px] w-full rounded bg-white/10 mb-[8px]" />
                <div className="flex justify-between">
                  <div className="h-[12px] w-[80px] rounded bg-white/10" />
                  <div className="h-[12px] w-[60px] rounded bg-white/10" />
                </div>
              </div>
            ))}

          {/* Project Cards */}
          {!error &&
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isFollowed={followedIds.has(project.id)}
                isFollowInFlight={inFlightFollowIds.has(project.id)}
                onToggleFollow={handleToggleFollow}
                onSelect={handleSelectProject}
              />
            ))}

          {/* Empty State */}
          {!loading && !error && projects.length === 0 && (
            <div className="col-span-full rounded-[16px] border border-dashed border-white/15 bg-white/5 p-[36px] text-center font-body-md text-on-surface-variant">
              {debouncedQ ? (
                <>
                  No projects found for &ldquo;{debouncedQ}&rdquo;. The live
                  site will also search within 10 km of any place you type.
                </>
              ) : (
                <>No projects match these filters. Try another type.</>
              )}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {!loading && !error && projects.length < total && (
          <div className="mt-[32px] flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full border border-white/15 bg-white/5 px-[28px] py-[10px] font-body-md text-[14px] text-on-surface transition-all hover:border-primary-container hover:text-primary-container disabled:opacity-50 focus-visible:outline-none"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </main>

      {/* Detail Slideout Panel */}
      {selectedProject && (
        <ProjectPanel
          project={selectedProject}
          originCard={triggerElementRef.current}
          isFollowed={followedIds.has(selectedProject.id)}
          isFollowInFlight={inFlightFollowIds.has(selectedProject.id)}
          onToggleFollow={handleToggleFollow}
          onStartClose={handleStartClose}
          onClose={handleClosePanel}
          onProjectUpdated={(freshProject) => {
            setSelectedProject(freshProject);
            setProjects((prev) =>
              prev.map((p) => (p.id === freshProject.id ? freshProject : p))
            );
          }}
        />
      )}

      {/* Follow Error Toast */}
      {followError && (
        <div
          role="status"
          className="fixed bottom-[24px] right-[24px] z-50 rounded-xl border border-danger/60 bg-surface-container-lowest px-[16px] py-[12px] font-body-md text-[13px] text-danger shadow-2xl backdrop-blur-md"
        >
          {followError}
        </div>
      )}
    </div>
  );
}
