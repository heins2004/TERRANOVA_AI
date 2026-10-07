"use client";

import React from "react";

type PanelHeaderProps = {
  title: string;
  is_demo?: boolean;
  category?: string | null;
  cityName: string;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function PanelHeader({
  title,
  is_demo,
  category,
  cityName,
  closeButtonRef,
  onClose,
}: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-[16px]">
      <div>
        <div className="flex items-center gap-[8px]">
          <h2
            id="panel-title"
            className="font-body-md text-[24px] sm:text-[32px] font-bold text-on-surface"
          >
            {title}
          </h2>
          {is_demo && (
            <span className="rounded-full border border-secondary/30 bg-secondary/15 px-[8px] py-[2px] font-data-mono text-[10px] font-semibold tracking-wider text-secondary uppercase">
              Demo
            </span>
          )}
        </div>
        <p className="mt-[4px] font-body-md text-[14px] text-on-surface-variant">
          {category ?? "General"} · {cityName}
        </p>
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 font-data-mono text-[16px] text-on-surface transition-colors hover:border-primary-container hover:text-primary-container focus-visible:border-primary-container focus-visible:outline-none"
      >
        ✕
      </button>
    </div>
  );
}
