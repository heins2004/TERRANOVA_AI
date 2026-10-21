"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { PublicComment, PublicProject, getProject, listComments } from "@/services/publicProjects";
import { PanelHeader } from "./PanelHeader";
import { ProjectPanelBody } from "./ProjectPanelBody";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { parseCommentError } from "./commentUtils";

export { parseCommentError };

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

  const [isClosedLocally, setIsClosedLocally] = useState<boolean>(false);
  const [postedCommentId, setPostedCommentId] = useState<number | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");

  useEffect(() => {
    if (postedCommentId != null) {
      const timer = setTimeout(() => {
        if (newCommentRef.current) newCommentRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [postedCommentId, comments]);

  // Fetch full project detail on open
  useEffect(() => {
    const ac = new AbortController();
    getProject(project.id, ac.signal)
      .then((data) => setDetail(data))
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
        if (data.length < 20) setHasMoreComments(false);
      })
      .catch(() => {})
      .finally(() => setIsLoadingComments(false));
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
      if (more.length < 20) setHasMoreComments(false);
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

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panel = panelRef.current;
    const dialog = dialogRef.current;

    onStartClose?.();

    if (prefersReducedMotion || !originCard || !panel || !dialog) {
      if (dialog && panel && prefersReducedMotion) {
        dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
        const anim = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
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

    dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: "forwards" });
    const closeAnim = panel.animate(
      [{ clipPath: FULL }, { clipPath: clip }],
      { duration: 900, easing: EASE, fill: "forwards" }
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
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panel = panelRef.current;
    const dialog = dialogRef.current;

    if (!panel || !dialog) return;
    closeButtonRef.current?.focus();

    if (prefersReducedMotion || !originCard) {
      dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: "forwards" });
      panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: "forwards" });
      return;
    }

    const F = panel.getBoundingClientRect();
    const C = originCard.getBoundingClientRect();
    const clip = getClip(F, C);

    originCard.style.visibility = "hidden";
    dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: "forwards" });
    panel.animate([{ clipPath: clip }, { clipPath: FULL }], { duration: 1200, easing: EASE, fill: "forwards" });

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
          (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true"
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  // Lock body scroll behind dialog without layout shift
  useBodyScrollLock(dialogRef);

  const isOpen =
    !isClosedLocally &&
    detail.stage === "OpenForResponse" &&
    detail.days_left != null &&
    detail.days_left > 0;

  const isGovOfficial = user?.role === "Government Official";
  const cityName = detail.city_name || detail.city || "India";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-[16px] sm:p-[24px] bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        className="relative flex flex-col w-full max-w-[1440px] h-[92vh] max-h-[900px] overflow-hidden rounded-[20px] border border-white/15 bg-surface-container-lowest p-[16px] sm:p-[24px] shadow-2xl backdrop-blur-3xl"
      >
        <PanelHeader
          title={detail.title}
          is_demo={detail.is_demo}
          category={detail.category}
          cityName={cityName}
          isFollowed={isFollowed}
          isFollowInFlight={isFollowInFlight}
          onToggleFollow={() => onToggleFollow?.(detail.id)}
          closeButtonRef={closeButtonRef}
          onClose={requestClose}
        />

        <ProjectPanelBody
          detail={detail}
          user={user}
          isOpen={isOpen}
          isGovOfficial={isGovOfficial}
          comments={comments}
          isLoadingComments={isLoadingComments}
          hasMoreComments={hasMoreComments}
          onLoadMoreComments={handleLoadMoreComments}
          postedCommentId={postedCommentId}
          newCommentRef={newCommentRef}
          liveMessage={liveMessage}
          setComments={setComments}
          setPostedCommentId={setPostedCommentId}
          setLiveMessage={setLiveMessage}
          setIsClosedLocally={setIsClosedLocally}
          onProjectUpdated={onProjectUpdated}
        />
      </div>
    </div>
  );
}
