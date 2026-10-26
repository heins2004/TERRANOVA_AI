"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface ActivityMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  variant?: "default" | "warning" | "danger";
}

interface GovActivityMenuProps {
  items: ActivityMenuItem[];
}

export function GovActivityMenu({ items }: GovActivityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const validItems = items.filter(Boolean);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const right = Math.max(16, window.innerWidth - rect.right);
    const top = rect.bottom + 6;
    setMenuPosition({ top, right });
  }, []);

  const openMenu = (focusIndex = 0) => {
    updatePosition();
    setIsOpen(true);
    setActiveIndex(focusIndex);
  };

  const closeMenu = (returnFocus = true) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (returnFocus && triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  // Keyboard navigation & focus management
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [isOpen, activeIndex]);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        closeMenu(false);
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  if (validItems.length === 0) {
    return null;
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(validItems.length - 1);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % validItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + validItems.length) % validItems.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(validItems.length - 1);
    } else if (e.key === "Tab") {
      closeMenu(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        id="gov-activity-controls-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="gov-activity-menu"
        onClick={() => {
          if (isOpen) closeMenu(false);
          else openMenu(0);
        }}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex items-center gap-[8px] rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[11px] sm:text-[12px] font-semibold text-primary uppercase tracking-wider hover:bg-primary-container/30 transition-all focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)]"
      >
        <span>Activity controls</span>
        <span
          className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id="gov-activity-menu"
          role="menu"
          aria-labelledby="gov-activity-controls-trigger"
          onKeyDown={handleMenuKeyDown}
          style={{
            position: "fixed",
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            zIndex: 1200,
            maxWidth: "calc(100vw - 32px)",
            minWidth: "200px",
          }}
          className="rounded-xl border border-white/15 bg-surface-container-lowest/95 backdrop-blur-md p-[6px] shadow-[0_8px_30px_rgba(0,0,0,0.8)] focus:outline-none"
        >
          <div className="flex flex-col gap-[2px]">
            {validItems.map((item, idx) => {
              const isWarning = item.variant === "warning";
              const isDanger = item.variant === "danger";

              const colorClass = isDanger
                ? "text-danger hover:bg-danger/15 focus:bg-danger/15"
                : isWarning
                ? "text-warning hover:bg-warning/15 focus:bg-warning/15"
                : "text-white hover:bg-white/10 focus:bg-white/10 hover:text-primary";

              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitem"
                  id={item.id}
                  disabled={item.disabled}
                  title={item.disabled ? item.disabledReason : undefined}
                  tabIndex={activeIndex === idx ? 0 : -1}
                  onClick={() => {
                    if (item.disabled) return;
                    closeMenu(true);
                    item.onClick();
                  }}
                  className={`w-full text-left px-[12px] py-[8px] rounded-[8px] font-data-mono text-[11px] font-medium uppercase tracking-wider transition-colors focus:outline-none ${colorClass} ${
                    item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
