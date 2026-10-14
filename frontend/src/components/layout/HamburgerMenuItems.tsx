"use client";

import Link from "next/link";

type MenuItemsProps = {
  role?: string;
  isAuthenticated: boolean;
  mustChangePassword?: boolean;
  isLoggingOut: boolean;
  onLinkClick: () => void;
  onLogout: () => void;
};

export function HamburgerMenuItems({
  role,
  isAuthenticated,
  mustChangePassword,
  isLoggingOut,
  onLinkClick,
  onLogout,
}: MenuItemsProps) {
  if (mustChangePassword) {
    return (
      <button
        type="button"
        role="menuitem"
        id="menu-item-logout"
        disabled={isLoggingOut}
        onClick={onLogout}
        className="flex h-[38px] w-full items-center gap-[10px] rounded-lg px-[12px] text-left font-body-md text-[13px] text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px] pointer-events-none">
          logout
        </span>
        <span className="pointer-events-none">{isLoggingOut ? "Logging out..." : "Log out"}</span>
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Link
          href="/"
          role="menuitem"
          id="menu-item-browse-projects"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
            explore
          </span>
          <span className="pointer-events-none">Browse projects</span>
        </Link>
        <Link
          href="/login"
          role="menuitem"
          id="menu-item-login"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
            login
          </span>
          <span className="pointer-events-none">Log in</span>
        </Link>
        <Link
          href="/register"
          role="menuitem"
          id="menu-item-register"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
            person_add
          </span>
          <span className="pointer-events-none">Register</span>
        </Link>
      </>
    );
  }

  // Define role primary navigation
  return (
    <>
      {role === "Citizen" && (
        <Link
          href="/"
          role="menuitem"
          id="menu-item-home"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
            home
          </span>
          <span className="pointer-events-none">Home</span>
        </Link>
      )}

      {role === "Urban Planner" && (
        <Link
          href="/planner"
          role="menuitem"
          id="menu-item-planner-portal"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
            architecture
          </span>
          <span className="pointer-events-none">Planner portal</span>
        </Link>
      )}

      {role === "Government Official" && (
        <>
          <Link
            href="/gov"
            role="menuitem"
            id="menu-item-gov-portal"
            onClick={onLinkClick}
            className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
              account_balance
            </span>
            <span className="pointer-events-none">Government portal</span>
          </Link>
          <Link
            href="/gov/new"
            role="menuitem"
            id="menu-item-new-project"
            onClick={onLinkClick}
            className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
              add_circle
            </span>
            <span className="pointer-events-none">New project</span>
          </Link>
        </>
      )}

      {role === "Administrator" && (
        <Link
          href="/admin"
          role="menuitem"
          id="menu-item-admin-dashboard"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
            admin_panel_settings
          </span>
          <span className="pointer-events-none">Admin dashboard</span>
        </Link>
      )}

      {/* Shared Profile & Logout across all authenticated roles */}
      <Link
        href="/profile"
        role="menuitem"
        id="menu-item-profile"
        onClick={onLinkClick}
        className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
      >
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">
          account_circle
        </span>
        <span className="pointer-events-none">My profile</span>
      </Link>

      <button
        type="button"
        role="menuitem"
        id="menu-item-logout"
        disabled={isLoggingOut}
        onClick={onLogout}
        className="flex h-[38px] w-full items-center gap-[10px] rounded-lg px-[12px] text-left font-body-md text-[13px] text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px] pointer-events-none">
          logout
        </span>
        <span className="pointer-events-none">{isLoggingOut ? "Logging out..." : "Log out"}</span>
      </button>
    </>
  );
}
