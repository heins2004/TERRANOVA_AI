"use client";

import React from "react";

type PanelHeaderProps = {
  title: string;
  is_demo?: boolean;
  category?: string | null;
  cityName: string;
  isFollowed?: boolean;
  isFollowInFlight?: boolean;
  onToggleFollow?: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function PanelHeader({
  title,
  is_demo,
  category,
  cityName,
  isFollowed = false,
  isFollowInFlight = false,
  onToggleFollow,
  closeButtonRef,
  onClose,
}: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-[16px] shrink-0 border-b border-white/10 pb-[16px]">
      <div className="min-w-0 pr-[8px]">
        <div className="flex items-center gap-[8px] flex-wrap">
          <h2
            id="panel-title"
            className="font-body-md text-[20px] sm:text-[26px] font-bold text-on-surface truncate"
          >
            {title}
          </h2>
          {is_demo && (
            <span className="rounded-full border border-secondary/30 bg-secondary/15 px-[8px] py-[2px] font-data-mono text-[10px] font-semibold tracking-wider text-secondary uppercase shrink-0">
              Demo
            </span>
          )}
        </div>
        <p className="mt-[4px] font-body-md text-[13px] text-on-surface-variant">
          {category ?? "General"} · {cityName}
        </p>
      </div>

      <div className="flex items-center gap-[10px] shrink-0">
        <button
          type="button"
          disabled={isFollowInFlight}
          aria-label={`Follow ${title}`}
          aria-pressed={isFollowed}
          onClick={onToggleFollow}
          className={`inline-flex h-[40px] items-center justify-center rounded-full border px-[16px] font-body-md text-[13px] font-medium transition-all ${
            isFollowed
              ? "border-primary-container/80 bg-primary-container/20 text-primary-container"
              : "border-white/15 bg-white/5 text-on-surface-variant hover:border-white/30 hover:text-on-surface"
          } ${isFollowInFlight ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span>{isFollowed ? "Following" : "Follow"}</span>
        </button>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 font-data-mono text-[16px] text-on-surface transition-colors hover:border-primary-container hover:text-primary-container focus-visible:border-primary-container focus-visible:outline-none cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
