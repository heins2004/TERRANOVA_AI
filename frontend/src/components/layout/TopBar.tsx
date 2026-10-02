"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { AuthUser } from "@/lib/auth";

type TopBarProps = {
  user?: AuthUser | null;
  className?: string;
};

export function TopBar({ user: propUser, className = "" }: TopBarProps) {
  const pathname = usePathname();
  const { user: authUser, logout, isReady, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const currentUser = propUser ?? authUser;
  const isLoggedIn = Boolean(currentUser ?? (isReady && isAuthenticated));

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const isHomeActive = pathname === "/";

  return (
    <header
      id="top-bar"
      className={`relative z-30 w-full border-b border-white/10 bg-surface-container-lowest/85 px-[16px] py-[10px] sm:px-[24px] backdrop-blur-md ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-[16px]">
        {/* Left: Brand text (plain text, never a link) + system readout */}
        <div className="flex items-center gap-[10px] sm:gap-[16px]">
          <span className="font-display-md text-[14px] sm:text-[15px] font-semibold tracking-wider text-primary uppercase select-none">
            TERRANOVA AI
          </span>
          <span className="h-[12px] w-[1px] bg-white/20" aria-hidden="true" />
          <span className="font-data-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-primary-container font-semibold">
            SYS.INIT.SEQ // V.4.2.1
          </span>
        </div>

        {/* Right Corner: Home and Logout (or Access system if logged-out on subpages) */}
        <div className="flex items-center gap-[8px] sm:gap-[12px]">
          <Link
            href="/"
            id="topbar-home-link"
            aria-label="Home"
            aria-current={isHomeActive ? "page" : undefined}
            className={`inline-flex items-center justify-center gap-[6px] rounded px-[10px] py-[6px] sm:px-[12px] sm:py-[6px] font-label-caps text-[11px] tracking-wider uppercase transition-all ${
              isHomeActive
                ? "border border-primary-container/80 bg-primary-container/15 text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                : "border border-white/15 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              home
            </span>
            <span className="hidden sm:inline">Home</span>
          </Link>

          {isLoggedIn ? (
            <button
              type="button"
              id="topbar-logout-button"
              aria-label="Logout"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              className="inline-flex items-center justify-center gap-[6px] rounded border border-danger/40 bg-danger/5 px-[10px] py-[6px] sm:px-[12px] sm:py-[6px] font-label-caps text-[11px] tracking-wider uppercase text-danger transition-all hover:border-danger/80 hover:bg-danger/15 hover:shadow-[0_0_12px_rgba(248,113,113,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                logout
              </span>
              <span className="hidden sm:inline">
                {isLoggingOut ? "Disconnecting..." : "Logout"}
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              id="topbar-login-link"
              aria-label="Access system"
              className="inline-flex items-center justify-center gap-[6px] rounded border border-primary-container/60 bg-primary-container/10 px-[10px] py-[6px] sm:px-[12px] sm:py-[6px] font-label-caps text-[11px] tracking-widest uppercase text-primary transition-all hover:bg-primary-container/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                login
              </span>
              <span className="hidden sm:inline">Access system</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
