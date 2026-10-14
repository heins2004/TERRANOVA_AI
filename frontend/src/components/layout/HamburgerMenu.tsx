"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { Avatar } from "@/components/ui/Avatar";
import { HamburgerMenuItems } from "./HamburgerMenuItems";

export function HamburgerMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isActionInFlightRef = useRef(false);

  // Focus return to button on close
  const prevOpenRef = useRef(isOpen);
  useEffect(() => {
    if (prevOpenRef.current && !isOpen) {
      buttonRef.current?.focus();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle Escape key and outside clicks
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  async function handleLogout() {
    if (isActionInFlightRef.current || isLoggingOut) return;
    isActionInFlightRef.current = true;
    setIsLoggingOut(true);
    try {
      setIsOpen(false);
      await logout();
    } finally {
      setIsLoggingOut(false);
      isActionInFlightRef.current = false;
    }
  }

  return (
    <div className="relative inline-block text-left">
      {/* Hamburger Toggle Button */}
      <button
        ref={buttonRef}
        type="button"
        id="hamburger-menu-button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="hamburger-menu-drawer"
        aria-haspopup="true"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white/15 bg-white/5 text-on-surface transition-all hover:border-primary-container/60 hover:bg-white/10 hover:text-primary focus-visible:outline-none focus-visible:border-primary-container"
      >
        <span
          className="material-symbols-outlined text-[20px]"
          aria-hidden="true"
        >
          {isOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Dropdown / Drawer */}
      {isOpen && (
        <div
          ref={menuRef}
          id="hamburger-menu-drawer"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="hamburger-menu-button"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] max-w-[calc(100vw-32px)] rounded-xl border border-white/15 bg-surface-container-lowest/95 p-[16px] shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Header when logged in */}
          {isAuthenticated && user && (
            <div className="mb-[14px] flex items-center gap-[12px] border-b border-white/10 pb-[14px]">
              <Avatar
                avatarKey={user.avatar_key}
                size={42}
                alt={`${user.full_name}'s avatar`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-body-md text-[14px] font-semibold text-on-surface">
                  {user.full_name}
                </p>
                <p className="truncate font-data-mono text-[11px] uppercase tracking-wider text-primary-container">
                  {user.role}
                </p>
              </div>
            </div>
          )}

          {/* Menu Navigation Links */}
          <nav className="flex flex-col gap-[4px]" aria-label="Menu links">
            <HamburgerMenuItems
              role={user?.role}
              isAuthenticated={isAuthenticated}
              isLoggingOut={isLoggingOut}
              onLinkClick={() => setIsOpen(false)}
              onLogout={() => void handleLogout()}
            />
          </nav>
        </div>
      )}
    </div>
  );
}
