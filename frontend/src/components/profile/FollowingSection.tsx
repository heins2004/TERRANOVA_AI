"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FollowingItem,
  getFollowingProjects,
  unfollowProject,
} from "@/services/profile";

const PAGE_SIZE = 10;

type FollowingSectionProps = {
  onFollowCountChanged?: (newCount: number) => void;
};

export function FollowingSection({ onFollowCountChanged }: FollowingSectionProps) {
  const [items, setItems] = useState<FollowingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unfollow confirmation state
  const [unfollowTargetId, setUnfollowTargetId] = useState<number | null>(null);
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  const isActionInFlightRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getFollowingProjects(PAGE_SIZE, 0);
        if (!isMounted) return;
        setItems(data.items);
        setTotal(data.total);
        setOffset(data.items.length);
        onFollowCountChanged?.(data.total);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load followed projects.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [onFollowCountChanged]);

  async function handleLoadMore() {
    if (isActionInFlightRef.current || isLoadingMore || offset >= total) return;
    isActionInFlightRef.current = true;
    setIsLoadingMore(true);

    try {
      const data = await getFollowingProjects(PAGE_SIZE, offset);
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setOffset((prev) => prev + data.items.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load more projects.");
    } finally {
      setIsLoadingMore(false);
      isActionInFlightRef.current = false;
    }
  }

  async function handleConfirmUnfollow(projectId: number) {
    if (isActionInFlightRef.current || isUnfollowing) return;
    isActionInFlightRef.current = true;
    setIsUnfollowing(true);

    try {
      await unfollowProject(projectId);
      setItems((prev) => prev.filter((p) => p.id !== projectId));
      setTotal((prev) => {
        const next = Math.max(0, prev - 1);
        onFollowCountChanged?.(next);
        return next;
      });
      setUnfollowTargetId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unfollow project.");
    } finally {
      setIsUnfollowing(false);
      isActionInFlightRef.current = false;
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-[20px] sm:p-[28px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col gap-[20px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-[14px]">
        <div>
          <h2 className="font-display-md text-[18px] font-semibold text-on-surface">
            Following {total > 0 ? `(${total})` : "0"}
          </h2>
          <p className="mt-[2px] font-body-md text-[12px] text-on-surface-variant">
            Projects you are currently tracking across public development stages.
          </p>
        </div>
        <span className="font-data-mono text-[12px] font-semibold text-primary-container">
          Following {total}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-[8px] rounded-lg border border-danger/40 bg-danger/10 px-[14px] py-[10px] text-[13px] text-danger"
        >
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-[48px]">
          <span
            className="h-[28px] w-[28px] animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[48px] text-center">
          <span
            className="material-symbols-outlined text-[40px] text-on-surface-variant/40"
            aria-hidden="true"
          >
            bookmark_border
          </span>
          <p className="mt-[10px] font-body-md text-[14px] text-on-surface-variant">
            You are not following any projects yet.
          </p>
          <Link
            href="/"
            className="mt-[14px] inline-flex items-center gap-[6px] rounded-lg border border-primary-container/60 bg-primary-container/10 px-[16px] py-[8px] font-body-md text-[13px] font-medium text-primary hover:bg-primary-container/20 transition-all"
          >
            Explore public projects
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {items.map((project) => {
            const isTargeted = unfollowTargetId === project.id;
            return (
              <div
                key={project.id}
                className="flex flex-col justify-between gap-[12px] rounded-xl border border-white/10 bg-white/[0.02] p-[16px] transition-all hover:border-white/20 sm:flex-row sm:items-center"
              >
                <div className="flex flex-col gap-[6px] min-w-0">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="rounded bg-white/10 px-[8px] py-[2px] font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {project.category || "General"}
                    </span>
                    <span className="rounded border border-primary-container/40 bg-primary-container/10 px-[8px] py-[2px] font-data-mono text-[10px] uppercase tracking-wider text-primary-container">
                      {project.stage}
                    </span>
                    {project.city_name && (
                      <span className="flex items-center gap-[2px] font-data-mono text-[11px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[12px]">
                          location_on
                        </span>
                        {project.city_name}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/?project=${project.id}`}
                    className="truncate font-display-md text-[15px] font-semibold text-on-surface transition-colors hover:text-primary"
                  >
                    {project.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-[12px] font-data-mono text-[11px] text-on-surface-variant/80">
                    {project.days_left !== null && (
                      <span className="text-primary-container">
                        {project.days_left === 0
                          ? "Deadline today"
                          : `${project.days_left} days left`}
                      </span>
                    )}
                    {project.halt_reason && (
                      <span className="text-danger truncate max-w-[280px]">
                        Halted: {project.halt_reason}
                      </span>
                    )}
                    <span>
                      Followed on{" "}
                      {new Date(project.followed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Unfollow Button / Confirmation */}
                <div className="shrink-0 flex items-center gap-[8px]">
                  {isTargeted ? (
                    <div className="flex items-center gap-[6px] rounded-lg border border-danger/40 bg-danger/10 p-[4px]">
                      <span className="px-[6px] font-body-md text-[11px] text-danger">
                        Unfollow?
                      </span>
                      <button
                        type="button"
                        disabled={isUnfollowing}
                        onClick={() => void handleConfirmUnfollow(project.id)}
                        className="rounded bg-danger px-[8px] py-[3px] font-body-md text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isUnfollowing ? "..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        disabled={isUnfollowing}
                        onClick={() => setUnfollowTargetId(null)}
                        className="rounded border border-white/20 px-[8px] py-[3px] font-body-md text-[11px] text-on-surface transition-colors hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUnfollowing}
                      onClick={() => setUnfollowTargetId(project.id)}
                      className="inline-flex h-[34px] items-center gap-[6px] rounded-lg border border-white/15 bg-white/5 px-[12px] font-body-md text-[12px] text-on-surface transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        bookmark_remove
                      </span>
                      <span>Unfollow</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {offset < total && (
            <div className="flex justify-center pt-[10px]">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => void handleLoadMore()}
                className="inline-flex h-[38px] items-center gap-[8px] rounded-lg border border-white/15 bg-white/5 px-[20px] font-body-md text-[13px] text-on-surface transition-colors hover:border-primary-container/50 hover:bg-white/10 disabled:opacity-50"
              >
                {isLoadingMore && (
                  <span
                    className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-primary border-t-transparent"
                    aria-hidden="true"
                  />
                )}
                <span>{isLoadingMore ? "Loading..." : "Load more"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
