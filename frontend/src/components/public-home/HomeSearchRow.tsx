"use client";

import React from "react";

type HomeSearchRowProps = {
  searchInputId: string;
  searchInput: string;
  onSearchChange: (val: string) => void;
};

export function HomeSearchRow({
  searchInputId,
  searchInput,
  onSearchChange,
}: HomeSearchRowProps) {
  return (
    <div className="relative z-10 mx-auto flex max-w-[1596px] items-center gap-[12px] px-[16px] pt-[16px] pb-[8px] sm:px-[32px] lg:px-[48px]">
      <label
        htmlFor={searchInputId}
        className="flex h-[46px] w-full flex-1 items-center gap-[10px] rounded-full border border-white/15 bg-white/5 px-[18px] shadow-sm backdrop-blur-[18px] transition-all focus-within:border-primary-container focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.25)]"
      >
        <span
          className="text-[16px] text-on-surface-variant select-none"
          aria-hidden="true"
        >
          ⌕
        </span>
        <input
          id={searchInputId}
          type="search"
          maxLength={80}
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value.slice(0, 80))}
          placeholder="Search a city, area or project"
          aria-label="Search a city, area or project"
          className="w-full min-w-0 bg-transparent font-body-md text-[14px] text-on-surface placeholder:text-on-surface-variant focus:outline-none"
        />
      </label>

      {/* Switched-off Theme Toggle */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-label="Switch theme (Soon)"
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[15px] text-on-surface-variant/60 cursor-not-allowed"
      >
        ◐
      </button>
    </div>
  );
}
