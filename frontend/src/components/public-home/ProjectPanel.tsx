"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import {
  PublicComment,
  PublicProject,
  formatIndianBudget,
  getProject,
  listComments,
} from "@/services/publicProjects";
import {
  CommentApiError,
  postComment,
} from "@/services/comments";
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
  onProjectUpdated?: (updatedProject: PublicProject) => void;
};

const FULL = "inset(0px 0px 0px 0px round 20px)";
const EASE = "cubic-bezier(.65,0,.2,1)";

const getClip = (F: DOMRect, C: DOMRect) =>
  `inset(${C.top - F.top}px ${F.right - C.right}px ${F.bottom - C.bottom}px ${C.left - F.left}px round 16px)`;

function cleanCommentBody(raw: string): string {
  return raw
    .split("")
    .filter((ch) => ch === "\n" || (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127))
    .join("")
    .trim();
}

function parseCommentError(err: unknown): {
  message: string;
  is401?: boolean;
  is409Closed?: boolean;
} {
  if (err instanceof CommentApiError) {
    if (err.status === 401) {
      return { message: "You must be logged in to comment.", is401: true };
    }
    if (err.status === 409) {
      const msg = err.serverMessage || "";
      if (msg.toLowerCase().includes("closed")) {
        return { message: "Comments are closed for this project.", is409Closed: true };
      }
      if (msg.toLowerCase().includes("identical") || msg.toLowerCase().includes("already")) {
        return { message: "You already posted this comment." };
      }
      return { message: msg };
    }
    if (err.status === 429) {
      const retryAfter = err.retryAfter ?? 60;
      const minutes = Math.max(1, Math.ceil(retryAfter / 60));
      return {
        message: `You are posting too fast. Try again in ${minutes} minutes.`,
      };
    }
    if (err.status === 403) {
      return { message: err.serverMessage };
    }
    if (err.status === 422) {
      return { message: "Check your comment and try again." };
    }
    if (err.status === 0) {
      return { message: "Could not post. Check your connection and try again." };
    }
    return { message: err.serverMessage || "Could not post. Check your connection and try again." };
  }
  return { message: "Could not post. Check your connection and try again." };
}

export function ProjectPanel({
  project,
  originCard,
  isFollowed = false,
  isFollowInFlight = false,
  onToggleFollow,
  onStartClose,
  onClose,
  onProjectUpdated,
}: ProjectPanelProps) {
  const router = useRouter();
  const { user } = useAuth();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isClosingRef = useRef<boolean>(false);
  const newCommentRef = useRef<HTMLDivElement | null>(null);

  const [detail, setDetail] = useState<PublicProject>(project);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [hasMoreComments, setHasMoreComments] = useState<boolean>(true);
  const [commentsOffset, setCommentsOffset] = useState<number>(0);

  // Comment posting state
  const [isClosedLocally, setIsClosedLocally] = useState<boolean>(false);
  const [topStance, setTopStance] = useState<"Support" | "Concern" | "Neutral" | null>(null);
  const [topBody, setTopBody] = useState<string>("");
  const [topStanceError, setTopStanceError] = useState<string | null>(null);
  const [topBodyError, setTopBodyError] = useState<string | null>(null);
  const [topFormError, setTopFormError] = useState<string | null>(null);
  const [isPostingTop, setIsPostingTop] = useState<boolean>(false);

  // Reply state
  const [activeReplyTarget, setActiveReplyTarget] = useState<{
    rootId: number;
    clickedId: number;
    authorName: string;
  } | null>(null);
  const [replyBody, setReplyBody] = useState<string>("");
  const [replyBodyError, setReplyBodyError] = useState<string | null>(null);
  const [replyFormError, setReplyFormError] = useState<string | null>(null);
  const [isPostingReply, setIsPostingReply] = useState<boolean>(false);

  // Focus & live announcements
  const [postedCommentId, setPostedCommentId] = useState<number | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");

  useEffect(() => {
    if (postedCommentId != null && newCommentRef.current) {
      newCommentRef.current.focus();
    }
  }, [postedCommentId]);

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

  // Open vs closed state determination
  const isOpen =
    !isClosedLocally &&
    detail.stage === "OpenForResponse" &&
    detail.days_left != null &&
    detail.days_left > 0;

  const isGovOfficial = user?.role === "Government Official";

  // Handle post top-level comment
  const handlePostTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopStanceError(null);
    setTopBodyError(null);
    setTopFormError(null);

    let hasClientError = false;

    if (!topStance) {
      setTopStanceError("Please select a stance.");
      hasClientError = true;
    }

    const cleaned = cleanCommentBody(topBody);
    if (cleaned.length < 3) {
      setTopBodyError("Comment must be at least 3 characters.");
      hasClientError = true;
    } else if (cleaned.length > 500) {
      setTopBodyError("Comment cannot exceed 500 characters.");
      hasClientError = true;
    }

    if (hasClientError) {
      return;
    }

    setIsPostingTop(true);
    try {
      const created = await postComment(detail.id, {
        body: cleaned,
        stance: topStance,
      });

      setTopBody("");
      setTopStance(null);
      setComments((prev) => [created, ...prev]);
      setPostedCommentId(created.id);
      setLiveMessage("Comment posted.");

      try {
        const fresh = await getProject(detail.id);
        setDetail(fresh);
        onProjectUpdated?.(fresh);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const parsed = parseCommentError(err);
      if (parsed.is401) {
        router.push("/login");
        return;
      }
      if (parsed.is409Closed) {
        setIsClosedLocally(true);
      }
      setTopFormError(parsed.message);
    } finally {
      setIsPostingTop(false);
    }
  };

  // Handle post reply
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyTarget) return;

    setReplyBodyError(null);
    setReplyFormError(null);

    const cleaned = cleanCommentBody(replyBody);
    if (cleaned.length < 3) {
      setReplyBodyError("Comment must be at least 3 characters.");
      return;
    } else if (cleaned.length > 500) {
      setReplyBodyError("Comment cannot exceed 500 characters.");
      return;
    }

    setIsPostingReply(true);
    try {
      const created = await postComment(detail.id, {
        body: cleaned,
        parent_id: activeReplyTarget.clickedId,
      });

      setReplyBody("");
      const targetRootId = activeReplyTarget.rootId;
      setActiveReplyTarget(null);

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === targetRootId || c.id === created.parent_id) {
            const existingReplies = c.replies || [];
            return {
              ...c,
              replies: [
                ...existingReplies,
                {
                  id: created.id,
                  author_name: created.author_name,
                  badge: created.badge,
                  stance: created.stance,
                  body: created.body,
                  created_at: created.created_at,
                  parent_id: created.parent_id,
                },
              ],
            };
          }
          return c;
        })
      );

      setPostedCommentId(created.id);
      setLiveMessage("Comment posted.");

      try {
        const fresh = await getProject(detail.id);
        setDetail(fresh);
        onProjectUpdated?.(fresh);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const parsed = parseCommentError(err);
      if (parsed.is401) {
        router.push("/login");
        return;
      }
      if (parsed.is409Closed) {
        setIsClosedLocally(true);
      }
      setReplyFormError(parsed.message);
    } finally {
      setIsPostingReply(false);
    }
  };

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

          {liveMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mb-[12px] rounded-lg border border-primary-container/40 bg-primary-container/10 px-[12px] py-[8px] font-body-md text-[13px] text-primary-container"
            >
              {liveMessage}
            </div>
          )}

          <div className="flex flex-col gap-[14px]">
            {comments.length === 0 && !isLoadingComments && (
              <p className="font-body-md text-[13px] text-on-surface-variant">
                No comments recorded yet.
              </p>
            )}

            {comments.map((c) => {
              const isNewlyCreatedComment = c.id === postedCommentId;
              const allowReply = user && (isOpen || isGovOfficial);

              return (
                <div
                  key={c.id}
                  ref={isNewlyCreatedComment ? newCommentRef : null}
                  tabIndex={isNewlyCreatedComment ? -1 : undefined}
                  className="pt-[10px] border-t border-white/10 first:border-t-0 first:pt-0 outline-none"
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

                  <div className="mt-[4px] font-body-md text-[14px] text-on-surface/90 whitespace-pre-wrap break-words">
                    {c.body}
                  </div>

                  {/* Replies inside this thread */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-[8px] flex flex-col gap-[8px]">
                      {c.replies.map((reply) => {
                        const isNewlyCreatedReply = reply.id === postedCommentId;
                        return (
                          <div
                            key={reply.id}
                            ref={isNewlyCreatedReply ? newCommentRef : null}
                            tabIndex={isNewlyCreatedReply ? -1 : undefined}
                            className="ml-[14px] pl-[12px] border-l-2 border-primary-container/80 outline-none"
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
                            <div className="mt-[4px] font-body-md text-[13px] text-on-surface/85 whitespace-pre-wrap break-words">
                              {reply.body}
                            </div>

                            {/* Reply button on a reply */}
                            {allowReply && (
                              <div className="mt-[4px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeReplyTarget?.clickedId === reply.id) {
                                      setActiveReplyTarget(null);
                                      setReplyBody("");
                                      setReplyBodyError(null);
                                      setReplyFormError(null);
                                    } else {
                                      setActiveReplyTarget({
                                        rootId: c.id,
                                        clickedId: reply.id,
                                        authorName: reply.author_name,
                                      });
                                      setReplyBody("");
                                      setReplyBodyError(null);
                                      setReplyFormError(null);
                                    }
                                  }}
                                  aria-label={`Reply to ${reply.author_name}`}
                                  className="font-body-md text-[11px] text-primary-container hover:underline cursor-pointer"
                                >
                                  Reply
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply button on top-level comment */}
                  {allowReply && (
                    <div className="mt-[8px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeReplyTarget?.clickedId === c.id) {
                            setActiveReplyTarget(null);
                            setReplyBody("");
                            setReplyBodyError(null);
                            setReplyFormError(null);
                          } else {
                            setActiveReplyTarget({
                              rootId: c.id,
                              clickedId: c.id,
                              authorName: c.author_name,
                            });
                            setReplyBody("");
                            setReplyBodyError(null);
                            setReplyFormError(null);
                          }
                        }}
                        aria-label={`Reply to ${c.author_name}`}
                        className="font-body-md text-[11px] text-primary-container hover:underline cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  {/* Inline Reply Box under thread (only one open at a time) */}
                  {activeReplyTarget?.rootId === c.id && (
                    <form
                      onSubmit={handlePostReply}
                      className="mt-[12px] ml-[14px] p-[12px] rounded-[10px] border border-white/10 bg-white/5 flex flex-col gap-[8px]"
                    >
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`reply-box-${c.id}`}
                          className="font-body-md text-[12px] font-semibold text-on-surface"
                        >
                          Replying to {activeReplyTarget.authorName}
                        </label>
                        <span className="font-data-mono text-[11px] text-on-surface-variant">
                          {replyBody.length}/500
                        </span>
                      </div>

                      <textarea
                        id={`reply-box-${c.id}`}
                        rows={2}
                        value={replyBody}
                        onChange={(e) => {
                          setReplyBody(e.target.value);
                          setReplyBodyError(null);
                          setReplyFormError(null);
                        }}
                        placeholder="Write your reply..."
                        className="w-full rounded-[8px] border border-white/15 bg-surface-container-lowest p-[8px] font-body-md text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container focus:outline-none resize-none"
                      />

                      {replyBodyError && (
                        <p role="alert" className="font-body-md text-[12px] text-danger">
                          {replyBodyError}
                        </p>
                      )}

                      <div className="flex items-center gap-[10px] flex-wrap mt-[4px]">
                        <button
                          type="submit"
                          disabled={isPostingReply}
                          className="rounded-full bg-primary-container px-[16px] py-[5px] font-body-md text-[12px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isPostingReply ? "Posting..." : "Post reply"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyTarget(null);
                            setReplyBody("");
                            setReplyBodyError(null);
                            setReplyFormError(null);
                          }}
                          className="rounded-full border border-white/15 bg-white/5 px-[14px] py-[5px] font-body-md text-[12px] text-on-surface-variant hover:text-on-surface hover:border-white/30 cursor-pointer"
                        >
                          Cancel
                        </button>
                        {replyFormError && (
                          <div role="alert" className="font-body-md text-[12px] text-danger">
                            {replyFormError}
                          </div>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
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

          {/* Comment Section Footer: Guest vs Logged In (Open vs Closed) */}
          <div className="mt-[20px] pt-[16px] border-t border-white/10">
            {!user ? (
              /* Guest: Read-only comments with Log in button */
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[12px]">
                <p className="font-body-md text-[13px] text-on-surface-variant">
                  Sign in to join the discussion and share your stance.
                </p>
                <Link
                  href="/login"
                  className="rounded-full bg-primary-container px-[20px] py-[8px] font-body-md text-[13px] font-semibold text-on-primary hover:opacity-90 transition-all cursor-pointer inline-flex items-center"
                >
                  Log in to comment
                </Link>
              </div>
            ) : !isOpen ? (
              /* Logged in, but project is not open */
              <div>
                <p className="font-body-md text-[13px] text-on-surface-variant">
                  Comments are closed for this project.
                </p>
              </div>
            ) : (
              /* Logged in and project is open: Top-level Comment Form */
              <form onSubmit={handlePostTopComment} className="flex flex-col gap-[14px]">
                {/* Stance Selector */}
                <fieldset className="flex flex-col gap-[6px]">
                  <legend className="font-body-md text-[13px] font-semibold text-on-surface">
                    Your stance
                  </legend>
                  <div className="flex items-center gap-[16px] mt-[2px]">
                    {(["Support", "Concern", "Neutral"] as const).map((s, idx, arr) => (
                      <label
                        key={s}
                        className="flex items-center gap-[6px] cursor-pointer font-body-md text-[13px] text-on-surface"
                      >
                        <input
                          type="radio"
                          name="top-stance"
                          value={s}
                          checked={topStance === s}
                          onChange={() => {
                            setTopStance(s);
                            setTopStanceError(null);
                            setTopFormError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                              e.preventDefault();
                              const cur = topStance ? arr.indexOf(topStance) : -1;
                              const nxt = (cur + 1) % arr.length;
                              setTopStance(arr[nxt]);
                              setTopStanceError(null);
                              setTopFormError(null);
                            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                              e.preventDefault();
                              const cur = topStance ? arr.indexOf(topStance) : 0;
                              const prv = (cur - 1 + arr.length) % arr.length;
                              setTopStance(arr[prv]);
                              setTopStanceError(null);
                              setTopFormError(null);
                            } else if (e.key === " ") {
                              setTopStance(s);
                              setTopStanceError(null);
                              setTopFormError(null);
                            }
                          }}
                          className="text-primary-container focus:ring-primary-container"
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                  <p className="font-body-md text-[11px] text-on-surface-variant mt-[2px]">
                    Your latest stance counts once.
                  </p>
                  {topStanceError && (
                    <p role="alert" className="font-body-md text-[12px] text-danger mt-[2px]">
                      {topStanceError}
                    </p>
                  )}
                </fieldset>

                {/* Comment Body */}
                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="top-comment-body"
                      className="font-body-md text-[13px] font-semibold text-on-surface"
                    >
                      Your comment
                    </label>
                    <span className="font-data-mono text-[11px] text-on-surface-variant">
                      {topBody.length}/500
                    </span>
                  </div>
                  <textarea
                    id="top-comment-body"
                    rows={3}
                    value={topBody}
                    onChange={(e) => {
                      setTopBody(e.target.value);
                      setTopBodyError(null);
                      setTopFormError(null);
                    }}
                    placeholder="Share your perspective on this project..."
                    className="w-full rounded-[12px] border border-white/15 bg-white/5 p-[12px] font-body-md text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container focus:outline-none resize-none"
                  />
                  {topBodyError && (
                    <p role="alert" className="font-body-md text-[12px] text-danger">
                      {topBodyError}
                    </p>
                  )}
                </div>

                {/* Submit Row with Alert Region */}
                <div className="flex items-center gap-[12px] flex-wrap">
                  <button
                    type="submit"
                    disabled={isPostingTop}
                    className="rounded-full bg-primary-container px-[20px] py-[8px] font-body-md text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isPostingTop ? "Posting..." : "Post comment"}
                  </button>
                  {topFormError && (
                    <div role="alert" className="font-body-md text-[13px] text-danger">
                      {topFormError}
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
