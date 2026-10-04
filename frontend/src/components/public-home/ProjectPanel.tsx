"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { SampleProject } from "./sampleProjects";
import { StageTracker } from "./StageTracker";
import { StanceBar } from "./StanceBar";

type ProjectPanelProps = {
  project: SampleProject;
  originCard: HTMLElement | null;
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
  onStartClose,
  onClose,
}: ProjectPanelProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isClosingRef = useRef<boolean>(false);

  const totalPeople =
    project.stance.support + project.stance.concern + project.stance.neutral;

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
            <h2
              id="panel-title"
              className="font-body-md text-[24px] sm:text-[32px] font-bold text-on-surface"
            >
              {project.name}
            </h2>
            <p className="mt-[4px] font-body-md text-[14px] text-on-surface-variant">
              {project.category} · {project.city}
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
          <StageTracker stage={project.stage} haltReason={project.haltReason} />
        </div>

        {/* 3 Stats (Budget, Days Left, People) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px] my-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-[12px] sm:pb-0 sm:pr-[16px]">
            <b className="block font-data-mono text-[22px] text-on-surface">
              ₹{project.budgetCrore.toLocaleString("en-IN")} Cr
            </b>
            <span className="font-body-md text-[12px] text-on-surface-variant">
              Estimated Budget
            </span>
          </div>
          <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-[12px] sm:pb-0 sm:pr-[16px]">
            <b className="block font-data-mono text-[22px] text-on-surface">
              {project.stage === "OpenForResponse" ? project.daysLeft : "–"}
            </b>
            <span className="font-body-md text-[12px] text-on-surface-variant">
              Days left to respond
            </span>
          </div>
          <div>
            <b className="block font-data-mono text-[22px] text-on-surface">
              {totalPeople.toLocaleString("en-IN")}
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
            support={project.stance.support}
            concern={project.stance.concern}
            neutral={project.stance.neutral}
            showLabels={true}
          />
        </div>

        {/* About this project */}
        <div className="mb-[16px] rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[8px]">
            About this project
          </h4>
          <p className="font-body-md text-[14px] text-on-surface leading-relaxed">
            {project.description}
          </p>
          <div className="mt-[16px]">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex items-center gap-[6px] rounded-full border border-white/15 bg-white/5 px-[18px] py-[8px] font-body-md text-[12px] text-on-surface-variant/60 cursor-not-allowed"
            >
              <span>Follow this project</span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/50">
                (Soon)
              </span>
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
              Lat: {project.lat.toFixed(4)}° N, Lng: {project.lng.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
          <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[12px]">
            Public Comments
          </h4>

          <div className="flex flex-col gap-[14px]">
            {project.comments.map((c, idx) => (
              <div
                key={idx}
                className={`pt-[10px] ${
                  idx > 0 ? "border-t border-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-[8px]">
                  <b className="font-body-md text-[14px] text-on-surface">
                    {c.author}
                  </b>
                  <span className="font-data-mono text-[11px] text-on-surface-variant">
                    {c.stance}
                  </span>
                </div>
                <div className="mt-[4px] font-body-md text-[14px] text-on-surface/90">
                  {c.text}
                </div>

                {/* Reply */}
                {c.reply && (
                  <div className="mt-[8px] ml-[14px] pl-[12px] border-l-2 border-primary-container/80">
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <b className="font-body-md text-[13px] text-on-surface">
                        {c.reply.author}
                      </b>
                      <span
                        className={`rounded-full border px-[8px] py-[2px] font-data-mono text-[10px] uppercase tracking-wider ${
                          c.reply.badge === "Government response"
                            ? "border-primary-container/60 bg-primary-container/15 text-primary-container"
                            : "border-secondary/60 bg-secondary/15 text-secondary"
                        }`}
                      >
                        {c.reply.badge}
                      </span>
                    </div>
                    <div className="mt-[4px] font-body-md text-[13px] text-on-surface/85">
                      {c.reply.text}
                    </div>
                  </div>
                )}

                <div className="mt-[8px]">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="font-body-md text-[11px] text-on-surface-variant/50 cursor-not-allowed"
                  >
                    Reply (Soon)
                  </button>
                </div>
              </div>
            ))}
          </div>

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
