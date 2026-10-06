"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  PublicComment,
  PublicProject,
  formatIndianBudget,
  getProject,
  listComments,
} from "@/services/publicProjects";
import { StageTracker } from "./StageTracker";
import { StanceBar } from "./StanceBar";

type ProjectPanelProps = {
  project: PublicProject;
  originCard: HTMLElement | null;
  isFollowed?: boolean;
  isFollowInFlight?: boolean;
  onToggleFollow?: (projectId: number) => void;
  onStartClose?: () => void;
  onClose: () => void;
};

const FULL = "inset(0px 0px 0px 0px round 20px)";
const EASE = "cubic-bezier(.65,0,.2,1)";

const getClip = (F: DOMRect, C: DOMRect) =>
  `inset(${C.top - F.top}px ${F.right - C.right}px ${F.bottom - C.bottom}px ${C.left - F.left}px round 16px)`;

export function ProjectPanel({
  project,
  originCard,
  isFollowed = false,
  isFollowInFlight = false,
  onToggleFollow,
  onStartClose,
  onClose,
}: ProjectPanelProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isClosingRef = useRef<boolean>(false);

  const [detail, setDetail] = useState<PublicProject>(project);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [hasMoreComments, setHasMoreComments] = useState<boolean>(true);
  const [commentsOffset, setCommentsOffset] = useState<number>(0);

  // Fetch full project detail on open
  useEffect(() => {
    const ac = new AbortController();
    getProject(project.id, ac.signal)
      .then((data) => {
        setDetail(data);
      })
      .catch(() => {});
    return () => ac.abort();
  }, [project.id]);

  // Fetch first 20 comments on open
  useEffect(() => {
    const ac = new AbortController();
    setIsLoadingComments(true);
    listComments(project.id, { limit: 20, offset: 0 }, ac.signal)
      .then((data) => {
        setComments(data);
        setCommentsOffset(data.length);
        if (data.length < 20) {
          setHasMoreComments(false);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingComments(false);
      });
    return () => ac.abort();
  }, [project.id]);

  // Load more comments
  const handleLoadMoreComments = useCallback(async () => {
    if (isLoadingComments || !hasMoreComments) return;
    setIsLoadingComments(true);
    try {
      const more = await listComments(project.id, {
        limit: 20,
        offset: commentsOffset,
      });
      setComments((prev) => [...prev, ...more]);
      setCommentsOffset((prev) => prev + more.length);
      if (more.length < 20) {
        setHasMoreComments(false);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingComments(false);
    }
  }, [isLoadingComments, hasMoreComments, project.id, commentsOffset]);

  // Request close animation sequence
  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const panel = panelRef.current;
    const dialog = dialogRef.current;

    onStartClose?.();

    if (prefersReducedMotion || !originCard || !panel || !dialog) {
      if (dialog && panel && prefersReducedMotion) {
        dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 150,
          fill: "forwards",
        });
        const anim = panel.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 150,
          fill: "forwards",
        });
        anim.onfinish = () => {
          if (originCard) {
            originCard.style.visibility = "";
            originCard.focus();
          }
          onClose();
        };
      } else {
        if (originCard) {
          originCard.style.visibility = "";
          originCard.focus();
        }
        onClose();
      }
      return;
    }

    const F = panel.getBoundingClientRect();
    const C = originCard.getBoundingClientRect();
    const clip = getClip(F, C);

    dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 900,
      fill: "forwards",
    });

    const closeAnim = panel.animate(
      [{ clipPath: FULL }, { clipPath: clip }],
      {
        duration: 900,
        easing: EASE,
        fill: "forwards",
      }
    );

    closeAnim.onfinish = () => {
      if (originCard) {
        originCard.style.visibility = "";
        originCard.focus();
      }
      onClose();
    };
  }, [originCard, onStartClose, onClose]);

  // Open animation & focus management
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const panel = panelRef.current;
    const dialog = dialogRef.current;

    if (!panel || !dialog) return;

    closeButtonRef.current?.focus();

    if (prefersReducedMotion || !originCard) {
      dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 150,
        fill: "forwards",
      });
      panel.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 150,
        fill: "forwards",
      });
      return;
    }

    const F = panel.getBoundingClientRect();
    const C = originCard.getBoundingClientRect();
    const clip = getClip(F, C);

    originCard.style.visibility = "hidden";

    dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 700,
      fill: "forwards",
    });

    panel.animate([{ clipPath: clip }, { clipPath: FULL }], {
      duration: 1200,
      easing: EASE,
      fill: "forwards",
    });

    Array.from(panel.children).forEach((child) => {
      (child as HTMLElement).animate(
        [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }],
        { duration: 1200, fill: "forwards" }
      );
    });
  }, [originCard]);

  // Focus management: trap tab focus and handle Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) =>
            !el.hasAttribute("disabled") &&
            el.getAttribute("aria-disabled") !== "true"
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  const cityName = detail.city_name || detail.city || "India";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-[16px] sm:p-[24px] bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="relative flex flex-col w-full max-w-[960px] max-h-[92vh] overflow-y-auto rounded-[20px] border border-white/15 bg-surface-container-lowest p-[20px] sm:p-[32px] shadow-2xl backdrop-blur-3xl"
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <div className="flex items-center gap-[8px]">
              <h2
                id="panel-title"
                className="font-body-md text-[24px] sm:text-[32px] font-bold text-on-surface"
              >
                {detail.title}
              </h2>
              {detail.is_demo && (
                <span className="rounded-full border border-secondary/30 bg-secondary/15 px-[8px] py-[2px] font-data-mono text-[10px] font-semibold tracking-wider text-secondary uppercase">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-[4px] font-body-md text-[14px] text-on-surface-variant">
              {detail.category ?? "General"} · {cityName}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 font-data-mono text-[16px] text-on-surface transition-colors hover:border-primary-container hover:text-primary-container focus-visible:border-primary-container focus-visible:outline-none"
          >
            ✕
          </button>
        </div>

        {/* 3-Step Stage Tracker or Halted Banner */}
        <div className="mt-[20px]">
          <StageTracker
            stage={detail.stage}
            haltReason={detail.halt_reason ?? undefined}
          />
        </div>

        {/* 3 Stats (Budget, Days Left, People) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px] my-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-[12px] sm:pb-0 sm:pr-[16px]">
            <b className="block font-data-mono text-[22px] text-on-surface">
              {formatIndianBudget(detail.budget)}
            </b>
            <span className="font-body-md text-[12px] text-on-surface-variant">
              Estimated Budget
            </span>
          </div>
          <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-[12px] sm:pb-0 sm:pr-[16px]">
            <b className="block font-data-mono text-[22px] text-on-surface">
              {detail.stage === "OpenForResponse" && detail.days_left != null
                ? detail.days_left
                : "–"}
            </b>
            <span className="font-body-md text-[12px] text-on-surface-variant">
              Days left to respond
            </span>
          </div>
          <div>
            <b className="block font-data-mono text-[22px] text-on-surface">
              {detail.participants.toLocaleString("en-IN")}
            </b>
            <span className="font-body-md text-[12px] text-on-surface-variant">
              People participated
            </span>
          </div>
        </div>

        {/* What people think (Stance Bar & Breakdown) */}
        <div className="mb-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[10px]">
            What people think
          </h4>
          <StanceBar
            support={detail.support_count}
            concern={detail.concern_count}
            neutral={detail.neutral_count}
            showLabels={true}
          />
        </div>

        {/* About this project */}
        <div className="mb-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[8px]">
            About this project
          </h4>
          <p className="font-body-md text-[14px] text-on-surface leading-relaxed">
            {detail.description ?? "No project description has been recorded."}
          </p>
          <div className="mt-[16px]">
            <button
              type="button"
              disabled={isFollowInFlight}
              aria-label={`Follow ${detail.title}`}
              aria-pressed={isFollowed}
              onClick={() => onToggleFollow?.(detail.id)}
              className={`inline-flex items-center gap-[6px] rounded-full border px-[18px] py-[8px] font-body-md text-[12px] transition-all ${
                isFollowed
                  ? "border-primary-container/80 bg-primary-container/20 text-primary-container font-medium"
                  : "border-white/15 bg-white/5 text-on-surface-variant hover:border-white/30 hover:text-on-surface"
              } ${isFollowInFlight ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span>{isFollowed ? "Following" : "Follow"}</span>
            </button>
          </div>
        </div>

        {/* Location & Coordinates */}
        <div className="mb-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-[8px] mb-[10px]">
            <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Location
            </h4>
            <div className="flex items-center gap-[6px]">
              <span className="rounded-full border border-primary-container/40 bg-primary-container/10 px-[10px] py-[3px] font-data-mono text-[11px] text-primary-container">
                Simple
              </span>
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Satellite view (Soon)"
                className="flex items-center gap-[4px] rounded-full border border-white/15 bg-white/5 px-[10px] py-[3px] font-data-mono text-[11px] text-on-surface-variant/60 cursor-not-allowed"
              >
                <span>Satellite</span>
                <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/50">
                  (Soon)
                </span>
              </button>
            </div>
          </div>
          <div className="rounded-[10px] border border-white/10 bg-surface-container-lowest/80 p-[14px] font-data-mono text-[13px] text-on-surface flex items-center justify-between">
            <span>Coordinates:</span>
            <span className="text-primary-container font-medium">
              {detail.location_lat != null && detail.location_lng != null
                ? `Lat: ${detail.location_lat.toFixed(4)}° N, Lng: ${detail.location_lng.toFixed(4)}° E`
                : "Coordinates pending"}
            </span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[12px]">
            Public Comments
          </h4>

          <div className="flex flex-col gap-[14px]">
            {comments.length === 0 && !isLoadingComments && (
              <p className="font-body-md text-[13px] text-on-surface-variant">
                No comments recorded yet.
              </p>
            )}

            {comments.map((c) => (
              <div
                key={c.id}
                className="pt-[10px] border-t border-white/10 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-[8px]">
                  <b className="font-body-md text-[14px] text-on-surface">
                    {c.author_name}
                  </b>
                  {c.badge && (
                    <span className="rounded-full border border-primary-container/60 bg-primary-container/15 px-[8px] py-[2px] font-data-mono text-[10px] uppercase tracking-wider text-primary-container">
                      {c.badge}
                    </span>
                  )}
                  {c.stance && (
                    <span className="font-data-mono text-[11px] text-on-surface-variant">
                      {c.stance}
                    </span>
                  )}
                </div>
                <div className="mt-[4px] font-body-md text-[14px] text-on-surface/90">
                  {c.body}
                </div>

                {/* Reply */}
                {c.replies && c.replies.length > 0 && (
                  <div className="mt-[8px] flex flex-col gap-[8px]">
                    {c.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="ml-[14px] pl-[12px] border-l-2 border-primary-container/80"
                      >
                        <div className="flex flex-wrap items-center gap-[8px]">
                          <b className="font-body-md text-[13px] text-on-surface">
                            {reply.author_name}
                          </b>
                          {reply.badge && (
                            <span className="rounded-full border border-primary-container/60 bg-primary-container/15 px-[8px] py-[2px] font-data-mono text-[10px] uppercase tracking-wider text-primary-container">
                              {reply.badge}
                            </span>
                          )}
                          {reply.stance && (
                            <span className="font-data-mono text-[11px] text-on-surface-variant">
                              {reply.stance}
                            </span>
                          )}
                        </div>
                        <div className="mt-[4px] font-body-md text-[13px] text-on-surface/85">
                          {reply.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-[8px]">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    aria-label={`Reply to ${c.author_name} (Soon)`}
                    className="font-body-md text-[11px] text-on-surface-variant/50 cursor-not-allowed"
                  >
                    Reply (Soon)
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load more comments */}
          {hasMoreComments && comments.length > 0 && (
            <div className="mt-[16px] pt-[8px] text-center border-t border-white/10">
              <button
                type="button"
                onClick={handleLoadMoreComments}
                disabled={isLoadingComments}
                className="rounded-full border border-white/15 bg-white/5 px-[16px] py-[6px] font-body-md text-[12px] text-on-surface transition-colors hover:border-primary-container hover:text-primary-container disabled:opacity-50"
              >
                {isLoadingComments ? "Loading..." : "Load more comments"}
              </button>
            </div>
          )}

          {/* Post Comment Input (Switched off) */}
          <div className="mt-[20px] pt-[16px] border-t border-white/10">
            <div className="flex items-center gap-[8px] mb-[8px]">
              <select
                disabled
                aria-disabled="true"
                aria-label="Your stance (Soon)"
                className="rounded-full border border-white/15 bg-white/5 px-[12px] py-[6px] font-body-md text-[12px] text-on-surface-variant/60 cursor-not-allowed"
              >
                <option>Support</option>
                <option>Concern</option>
                <option>Neutral</option>
              </select>
              <span className="font-body-md text-[11px] text-on-surface-variant/60">
                Stance selector (Soon)
              </span>
            </div>

            <textarea
              disabled
              aria-disabled="true"
              aria-label="Comment input (Disabled for sample review)"
              rows={2}
              placeholder="Share your view (Disabled for sample review)"
              className="w-full rounded-[12px] border border-white/15 bg-white/5 p-[12px] font-body-md text-[13px] text-on-surface-variant/60 placeholder:text-on-surface-variant/40 cursor-not-allowed resize-none"
            />

            <div className="mt-[10px] flex items-center justify-between">
              <span className="font-body-md text-[11px] text-on-surface-variant">
                Comments are read-only in design review.
              </span>
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Post comment (Soon)"
                className="rounded-full border border-white/15 bg-white/5 px-[16px] py-[6px] font-body-md text-[12px] text-on-surface-variant/50 cursor-not-allowed"
              >
                Post (Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
