"use client";

import Link from "next/link";

type MenuItemsProps = {
  role?: string;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  onLinkClick: () => void;
  onLogout: () => void;
};

export function HamburgerMenuItems({
  role,
  isAuthenticated,
  isLoggingOut,
  onLinkClick,
  onLogout,
}: MenuItemsProps) {
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
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            explore
          </span>
          <span>Browse projects</span>
        </Link>
        <Link
          href="/login"
          role="menuitem"
          id="menu-item-login"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            login
          </span>
          <span>Log in</span>
        </Link>
        <Link
          href="/register"
          role="menuitem"
          id="menu-item-register"
          onClick={onLinkClick}
          className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            person_add
          </span>
          <span>Register</span>
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
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            home
          </span>
          <span>Home</span>
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
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            architecture
          </span>
          <span>Planner portal</span>
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
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              account_balance
            </span>
            <span>Government portal</span>
          </Link>
          <Link
            href="/gov/new"
            role="menuitem"
            id="menu-item-new-project"
            onClick={onLinkClick}
            className="flex h-[38px] items-center gap-[10px] rounded-lg px-[12px] font-body-md text-[13px] text-on-surface transition-colors hover:bg-white/10 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              add_circle
            </span>
            <span>New project</span>
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
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            admin_panel_settings
          </span>
          <span>Admin dashboard</span>
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
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
          account_circle
        </span>
        <span>My profile</span>
      </Link>

      <button
        type="button"
        role="menuitem"
        id="menu-item-logout"
        disabled={isLoggingOut}
        onClick={onLogout}
        className="flex h-[38px] w-full items-center gap-[10px] rounded-lg px-[12px] text-left font-body-md text-[13px] text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">
          logout
        </span>
        <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
      </button>
    </>
  );
}
