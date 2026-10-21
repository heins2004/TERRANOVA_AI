"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { AuthUser } from "@/lib/auth";

type TopBarProps = {
  user?: AuthUser | null;
  className?: string;
  showPlayIntro?: boolean;
  onPlayIntro?: () => void;
  style?: React.CSSProperties;
};

export function TopBar({
  user: propUser,
  className = "",
  showPlayIntro = false,
  onPlayIntro,
  style,
}: TopBarProps) {
  const pathname = usePathname();
  const { user: authUser, logout, isReady, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // If propUser is explicitly passed (even null), respect it. Otherwise fallback to auth context.
  const currentUser = propUser !== undefined ? propUser : (authUser ?? null);
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
  const isProfileActive = pathname === "/profile";
  const isGovActive = pathname.startsWith("/gov") && pathname !== "/gov/new";
  const isNewProjectActive = pathname === "/gov/new";
  const isPlannerActive = pathname.startsWith("/planner");
  const isAdminActive = pathname.startsWith("/admin");

  return (
    <header
      id="top-bar"
      style={style}
      className={`relative z-30 w-full border-b border-white/10 bg-surface-container-lowest/85 px-[16px] py-[10px] sm:px-[24px] backdrop-blur-md ${className}`}
    >
      <div className="flex w-full items-center justify-between gap-[16px]">
        {/* Left: Brand text (plain text, never a link) + system readout (wide screens only) */}
        <div className="flex items-center gap-[10px] sm:gap-[16px]">
          <span className="font-display-md text-[14px] sm:text-[15px] font-semibold tracking-wider text-primary uppercase select-none">
            TERRANOVA AI
          </span>
          <span className="hidden md:inline h-[12px] w-[1px] bg-white/20" aria-hidden="true" />
          <span className="hidden md:inline font-data-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-primary-container font-semibold">
            SYS.INIT.SEQ // V.4.2.1
          </span>
        </div>

        {/* Center: Play Intro button (only for guests when autoplay is blocked) */}
        {showPlayIntro && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
            <button
              type="button"
              id="play-intro-btn"
              aria-label="Play intro"
              onClick={onPlayIntro}
              className="h-[32px] inline-flex items-center gap-[6px] rounded-full border border-primary-container/80 bg-[#0a0e17]/90 px-[16px] font-data-mono text-[11px] font-semibold tracking-wider text-primary-container uppercase shadow-[0_0_20px_rgba(34,211,238,0.3)] backdrop-blur-md transition-all hover:bg-primary-container/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5 fill-current text-primary-container"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Play intro</span>
            </button>
          </div>
        )}

        {/* Right Corner: Navigation links, notification bell, hamburger and auth controls */}
        <div className="flex items-center gap-[8px] sm:gap-[12px]">
          {isLoggedIn && !currentUser?.must_change_password && (
            <>
              {currentUser?.role === "Government Official" && (
                <>
                  <Link
                    href="/gov"
                    id="topbar-gov-link"
                    aria-label="Government Portal"
                    aria-current={isGovActive ? "page" : undefined}
                    className={`hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase transition-all ${
                      isGovActive
                        ? "border border-primary-container/80 bg-primary-container/15 text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                        : "border border-white/15 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                      account_balance
                    </span>
                    <span className="pointer-events-none">Gov Portal</span>
                  </Link>

                  <Link
                    href="/gov/new"
                    id="topbar-new-project-link"
                    aria-label="New Project"
                    aria-current={isNewProjectActive ? "page" : undefined}
                    className={`hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase transition-all ${
                      isNewProjectActive
                        ? "border border-primary-container/80 bg-primary-container/15 text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                        : "border border-white/15 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                      add_circle
                    </span>
                    <span className="pointer-events-none">New project</span>
                  </Link>
                </>
              )}

              {currentUser?.role === "Urban Planner" && (
                <Link
                  href="/planner"
                  id="topbar-planner-link"
                  aria-label="Planner Portal"
                  aria-current={isPlannerActive ? "page" : undefined}
                  className={`hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase transition-all ${
                    isPlannerActive
                      ? "border border-primary-container/80 bg-primary-container/15 text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                      : "border border-white/15 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                    architecture
                  </span>
                  <span className="pointer-events-none">Planner Portal</span>
                </Link>
              )}

              {currentUser?.role === "Administrator" && (
                <Link
                  href="/admin"
                  id="topbar-admin-link"
                  aria-label="Admin Portal"
                  aria-current={isAdminActive ? "page" : undefined}
                  className={`hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase transition-all ${
                    isAdminActive
                      ? "border border-primary-container/80 bg-primary-container/15 text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                      : "border border-white/15 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                    admin_panel_settings
                  </span>
                  <span className="pointer-events-none">Admin Portal</span>
                </Link>
              )}

              <Link
                href="/"
                id="topbar-home-link"
                aria-label="Home"
                aria-current={isHomeActive ? "page" : undefined}
                className={`hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase transition-all ${
                  isHomeActive
                    ? "border border-primary-container/80 bg-primary-container/15 text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border border-white/15 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                  home
                </span>
                <span className="pointer-events-none">Home</span>
              </Link>

              <Link
                href="/profile"
                id="topbar-profile-link"
                aria-label="Profile"
                aria-current={isProfileActive ? "page" : undefined}
                className={`hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase transition-all ${
                  isProfileActive
                    ? "border border-primary-container/80 bg-primary-container/15 text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border border-white/15 bg-white/[0.02] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                  account_circle
                </span>
                <span className="pointer-events-none">Profile</span>
              </Link>
            </>
          )}

          {isLoggedIn && !currentUser?.must_change_password && <NotificationBell />}

          <HamburgerMenu />

          {isLoggedIn ? (
            <button
              type="button"
              id="topbar-logout-button"
              aria-label="Logout"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              className="hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded border border-danger/40 bg-danger/5 px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase text-danger transition-all hover:border-danger/80 hover:bg-danger/15 hover:shadow-[0_0_12px_rgba(248,113,113,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                logout
              </span>
              <span className="pointer-events-none">
                {isLoggingOut ? "Disconnecting..." : "Logout"}
              </span>
            </button>
          ) : (
            <>
              <Link
                href="/login"
                id="topbar-login-link"
                aria-label="Login"
                className="hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded border border-primary-container/60 bg-primary-container/10 px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase text-primary transition-all hover:bg-primary-container/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
              >
                <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                  login
                </span>
                <span className="pointer-events-none">Login</span>
              </Link>

              <Link
                href="/register"
                id="topbar-register-link"
                aria-label="Register"
                className="hidden md:inline-flex h-[32px] items-center justify-center gap-[6px] rounded border border-white/15 bg-white/[0.02] px-[12px] font-data-mono text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant transition-all hover:border-primary-container/50 hover:bg-white/[0.06] hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[16px] pointer-events-none" aria-hidden="true">
                  person_add
                </span>
                <span className="pointer-events-none">Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
