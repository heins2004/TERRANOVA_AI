"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthUser } from "@/lib/auth";

interface TopBarBackButtonProps {
  currentUser?: AuthUser | null;
}

export function TopBarBackButton({ currentUser }: TopBarBackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Visible on every page EXCEPT "/" and "/profile" (including /profile?section=...) and /change-password and for flagged users
  const isHiddenPage =
    pathname === "/" ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/profile?") ||
    pathname === "/change-password";

  const isFlagged = Boolean(currentUser?.must_change_password);

  if (isHiddenPage || isFlagged) {
    return null;
  }

  const handleBack = () => {
    const hasInAppHistory =
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state.idx === "number" &&
      window.history.state.idx > 0;

    if (hasInAppHistory) {
      router.back();
    } else {
      const fallback =
        currentUser?.role === "Government Official"
          ? "/gov"
          : currentUser?.role === "Urban Planner"
          ? "/planner"
          : currentUser?.role === "Administrator"
          ? "/admin"
          : "/";
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      id="topbar-back-btn"
      aria-label="Go back"
      title="Back"
      onClick={handleBack}
      className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded border border-white/15 bg-white/[0.04] text-on-surface-variant hover:border-primary-container/50 hover:bg-white/[0.08] hover:text-foreground transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-container"
    >
      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
    </button>
  );
}
