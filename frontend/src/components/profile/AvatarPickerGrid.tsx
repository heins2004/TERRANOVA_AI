"use client";

import { Avatar } from "@/components/ui/Avatar";

const AVATAR_KEYS = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1;
  return `avatar-${num < 10 ? `0${num}` : num}`;
});

type AvatarPickerGridProps = {
  selectedKey: string;
  onSelect: (key: string) => void;
  disabled?: boolean;
};

export function AvatarPickerGrid({
  selectedKey,
  onSelect,
  disabled = false,
}: AvatarPickerGridProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between">
        <label className="font-body-md text-[13px] font-medium text-on-surface">
          Choose an Avatar
        </label>
        <span className="font-data-mono text-[11px] text-on-surface-variant">
          20 options available
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Avatar options"
        className="grid grid-cols-5 gap-[10px] sm:grid-cols-10"
      >
        {AVATAR_KEYS.map((key) => {
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select ${key}`}
              disabled={disabled}
              onClick={() => onSelect(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(key);
                }
              }}
              className={`group relative flex h-[46px] w-[46px] items-center justify-center rounded-full p-[2px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                isSelected
                  ? "ring-2 ring-primary-container shadow-[0_0_12px_rgba(34,211,238,0.35)] scale-105"
                  : "hover:ring-1 hover:ring-white/40 hover:scale-105 opacity-80 hover:opacity-100"
              }`}
            >
              <Avatar avatarKey={key} size={40} />
              {isSelected && (
                <span
                  className="absolute -bottom-[2px] -right-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-primary-container text-black"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">
                    check
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
